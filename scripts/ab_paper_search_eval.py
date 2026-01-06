#!/usr/bin/env python3
"""
A/B evaluation for scientific paper retrieval pipelines.

Pipelines:
- current: Semantic Scholar + PubMed (+ optional Healthline if configured)
- skill: OpenAlex (K-Dense skill)
- current_plus_openalex: current + OpenAlex

Metrics per query and averaged:
- coverage: unique results count
- dedupe_rate: 1 - unique/total
- relevance_score: keyword overlap in title/abstract (0-100)
- freshness: avg publication age + recency score (0-100)
"""

import argparse
import csv
import os
import re
import sys
import time
from datetime import datetime, timezone
from statistics import mean
from typing import Dict, List, Optional

import requests

# Add OpenAlex skill client to path
OPENALEX_SKILL_PATH = "/tmp/claude-scientific-skills/scientific-skills/openalex-database/scripts"
if OPENALEX_SKILL_PATH not in sys.path:
    sys.path.append(OPENALEX_SKILL_PATH)

try:
    from openalex_client import OpenAlexClient
except Exception as e:
    print(f"Failed to import OpenAlexClient: {e}", file=sys.stderr)
    sys.exit(1)

# -----------------------------
# Config
# -----------------------------

DEFAULT_QUERIES = [
    "heart rate variability anxiety sleep",
    "insomnia sleep quality melatonin",
    "cortisol stress response anxiety",
    "panic attack physiological symptoms",
    "mindfulness breathing vagus nerve",
    "HRV biofeedback stress resilience",
    "depression fatigue energy metabolism",
    "cognitive behavioral therapy anxiety",
    "circadian rhythm sleep regulation",
    "social anxiety rejection sensitivity",
]

STOPWORDS = set([
    "the", "a", "an", "and", "or", "of", "for", "to", "in", "with",
    "about", "what", "how", "why", "is", "are", "can", "on", "by",
])

SEMANTIC_BASE = "https://api.semanticscholar.org/graph/v1"
SEMANTIC_FIELDS = "paperId,title,abstract,year,citationCount,url,externalIds"
PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
SEMANTIC_RETRIES = 4
SEMANTIC_DELAY_SEC = 1.5

# -----------------------------
# Helpers
# -----------------------------

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def normalize_title(title: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", " ", (title or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def normalize_doi(doi: Optional[str]) -> Optional[str]:
    if not doi:
        return None
    doi = doi.strip().lower()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi)
    return doi


def inverted_index_to_text(index: Optional[Dict]) -> str:
    if not index:
        return ""
    max_pos = -1
    for positions in index.values():
        if positions:
            max_pos = max(max_pos, max(positions))
    if max_pos < 0:
        return ""
    words = [""] * (max_pos + 1)
    for word, positions in index.items():
        for pos in positions:
            if pos < len(words):
                words[pos] = word
    return " ".join([w for w in words if w])


def extract_keywords(query: str) -> List[str]:
    tokens = re.split(r"[^a-z0-9]+", query.lower())
    return [t for t in tokens if len(t) > 2 and t not in STOPWORDS]


def relevance_score(query: str, title: str, abstract: str) -> float:
    keywords = extract_keywords(query)
    if not keywords:
        return 0.0
    haystack = f"{title} {abstract}".lower()
    hits = sum(1 for kw in keywords if kw in haystack)
    return (hits / len(keywords)) * 100.0


def recency_score(year: Optional[int], max_year_span: int = 20) -> Optional[float]:
    if not year:
        return None
    current_year = datetime.now(timezone.utc).year
    age = current_year - year
    score = max(0.0, 1.0 - (age / max_year_span))
    return score * 100.0


def build_dedupe_key(paper: Dict) -> str:
    doi = normalize_doi(paper.get("doi"))
    if doi:
        return f"doi:{doi}"
    return f"title:{normalize_title(paper.get('title', ''))}"

# -----------------------------
# Source Fetchers
# -----------------------------

def fetch_semantic_scholar(query: str, limit: int = 10, retries: int = SEMANTIC_RETRIES) -> List[Dict]:
    url = f"{SEMANTIC_BASE}/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": SEMANTIC_FIELDS,
    }
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    for attempt in range(retries + 1):
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=20)
            if resp.status_code == 429 and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            resp.raise_for_status()
            data = resp.json()
            break
        except Exception as e:
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            print(f"Semantic Scholar error: {e}", file=sys.stderr)
            return []

    results = []
    for item in data.get("data", []):
        doi = None
        external_ids = item.get("externalIds") or {}
        if external_ids.get("DOI"):
            doi = external_ids.get("DOI")
        results.append({
            "id": item.get("paperId"),
            "title": item.get("title") or "",
            "abstract": item.get("abstract") or "",
            "year": item.get("year"),
            "doi": doi,
            "source": "semantic_scholar",
        })
    return results


def fetch_pubmed(query: str, limit: int = 10) -> List[Dict]:
    if not query:
        return []

    # Build OR query similar to scientific-search.ts
    words = [w for w in query.split(" ") if len(w) > 2][:5]
    pubmed_query = " OR ".join(words) if words else query

    search_url = f"{PUBMED_BASE}/esearch.fcgi"
    params = {
        "db": "pubmed",
        "term": pubmed_query,
        "retmax": str(limit),
        "retmode": "json",
        "sort": "relevance",
    }

    try:
        resp = requests.get(search_url, params=params, timeout=20)
        resp.raise_for_status()
        ids = resp.json().get("esearchresult", {}).get("idlist", [])
    except Exception as e:
        print(f"PubMed search error: {e}", file=sys.stderr)
        return []

    if not ids:
        return []

    summary_url = f"{PUBMED_BASE}/esummary.fcgi"
    params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "json",
    }

    try:
        resp = requests.get(summary_url, params=params, timeout=20)
        resp.raise_for_status()
        result = resp.json().get("result", {})
    except Exception as e:
        print(f"PubMed summary error: {e}", file=sys.stderr)
        return []

    papers = []
    for pmid in ids:
        paper = result.get(pmid)
        if not paper:
            continue
        pubdate = paper.get("pubdate") or ""
        year_match = re.search(r"\b(19|20)\d{2}\b", pubdate)
        year = int(year_match.group(0)) if year_match else None

        doi = None
        eloc = paper.get("elocationid") or ""
        if isinstance(eloc, str) and "doi" in eloc.lower():
            doi = eloc.lower().replace("doi:", "").strip()

        papers.append({
            "id": f"pubmed_{pmid}",
            "title": paper.get("title") or "",
            "abstract": paper.get("sorttitle") or "",
            "year": year,
            "doi": doi,
            "source": "pubmed",
        })
    return papers


def fetch_openalex(query: str, limit: int = 10) -> List[Dict]:
    client = OpenAlexClient()
    try:
        resp = client.search_works(search=query, per_page=limit)
    except Exception as e:
        print(f"OpenAlex error: {e}", file=sys.stderr)
        return []

    results = []
    for item in resp.get("results", []):
        abstract = inverted_index_to_text(item.get("abstract_inverted_index"))
        results.append({
            "id": item.get("id"),
            "title": item.get("display_name") or item.get("title") or "",
            "abstract": abstract,
            "year": item.get("publication_year"),
            "doi": item.get("doi"),
            "source": "openalex",
        })
    return results

# -----------------------------
# Pipelines
# -----------------------------

def pipeline_current(query: str, limit: int = 10) -> List[Dict]:
    # Semantic Scholar + PubMed
    results = []
    results.extend(fetch_semantic_scholar(query, limit))
    time.sleep(SEMANTIC_DELAY_SEC)
    results.extend(fetch_pubmed(query, limit))
    return results


def pipeline_skill_openalex(query: str, limit: int = 10) -> List[Dict]:
    return fetch_openalex(query, limit)


def pipeline_current_plus_openalex(query: str, limit: int = 10) -> List[Dict]:
    results = pipeline_current(query, limit)
    time.sleep(0.2)
    results.extend(fetch_openalex(query, limit))
    return results

# -----------------------------
# Evaluation
# -----------------------------

def dedupe_papers(papers: List[Dict]) -> List[Dict]:
    seen = set()
    deduped = []
    for p in papers:
        key = build_dedupe_key(p)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(p)
    return deduped


def evaluate_pipeline(queries: List[str], pipeline_fn, limit: int) -> Dict:
    per_query = []
    all_papers = []

    for q in queries:
        papers = pipeline_fn(q, limit)
        total = len(papers)
        deduped = dedupe_papers(papers)
        unique = len(deduped)
        dedupe_rate = 1 - (unique / total) if total else 0.0

        # relevance + freshness
        rel_scores = [relevance_score(q, p.get("title", ""), p.get("abstract", "")) for p in deduped]
        rel_avg = mean(rel_scores) if rel_scores else 0.0

        ages = []
        recencies = []
        current_year = datetime.now(timezone.utc).year
        for p in deduped:
            year = p.get("year")
            if isinstance(year, int):
                ages.append(current_year - year)
                rec = recency_score(year)
                if rec is not None:
                    recencies.append(rec)

        age_avg = mean(ages) if ages else None
        rec_avg = mean(recencies) if recencies else None

        per_query.append({
            "query": q,
            "total": total,
            "unique": unique,
            "dedupe_rate": dedupe_rate,
            "relevance_avg": rel_avg,
            "age_avg": age_avg,
            "recency_avg": rec_avg,
        })
        all_papers.extend(deduped)

    # overall unique across all queries
    overall_unique = len(dedupe_papers(all_papers))

    # aggregate averages across queries
    avg_coverage = mean([p["unique"] for p in per_query]) if per_query else 0.0
    avg_dedupe_rate = mean([p["dedupe_rate"] for p in per_query]) if per_query else 0.0
    avg_relevance = mean([p["relevance_avg"] for p in per_query]) if per_query else 0.0

    ages = [p["age_avg"] for p in per_query if p["age_avg"] is not None]
    recs = [p["recency_avg"] for p in per_query if p["recency_avg"] is not None]
    avg_age = mean(ages) if ages else None
    avg_recency = mean(recs) if recs else None

    return {
        "per_query": per_query,
        "avg_coverage": avg_coverage,
        "avg_dedupe_rate": avg_dedupe_rate,
        "avg_relevance": avg_relevance,
        "avg_age": avg_age,
        "avg_recency": avg_recency,
        "overall_unique": overall_unique,
    }


def run_eval(queries: List[str], limit: int) -> Dict:
    return {
        "current": evaluate_pipeline(queries, pipeline_current, limit),
        "skill_openalex": evaluate_pipeline(queries, pipeline_skill_openalex, limit),
        "current_plus_openalex": evaluate_pipeline(queries, pipeline_current_plus_openalex, limit),
}

# -----------------------------
# CLI
# -----------------------------

def main():
    parser = argparse.ArgumentParser(description="A/B test for paper retrieval pipelines")
    parser.add_argument("--limit", type=int, default=10, help="Per-source limit per query")
    parser.add_argument("--queries", nargs="+", help="Override default query list")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("--csv", action="store_true", help="Write CSV summary")
    parser.add_argument("--csv-path", default="scripts/ab_paper_search_eval.csv", help="CSV output path")

    args = parser.parse_args()
    queries = args.queries if args.queries else DEFAULT_QUERIES

    results = run_eval(queries, args.limit)

    if args.json:
        import json
        print(json.dumps({"queries": queries, **results}, ensure_ascii=False, indent=2))
        return

    # Pretty summary
    def summarize(label: str, data: Dict):
        print(f"\n[{label}]")
        print(f"Avg coverage per query: {data['avg_coverage']:.2f}")
        print(f"Avg dedupe rate: {data['avg_dedupe_rate']:.2%}")
        print(f"Avg relevance score: {data['avg_relevance']:.1f}")
        if data["avg_age"] is not None:
            print(f"Avg age (years): {data['avg_age']:.2f}")
        else:
            print("Avg age (years): n/a")
        if data["avg_recency"] is not None:
            print(f"Avg recency score: {data['avg_recency']:.1f}")
        else:
            print("Avg recency score: n/a")
        print(f"Overall unique (all queries): {data['overall_unique']}")

    summarize("current (Semantic Scholar + PubMed)", results["current"])
    summarize("skill (OpenAlex)", results["skill_openalex"])
    summarize("current + OpenAlex", results["current_plus_openalex"])

    if args.csv:
        rows = []
        for pipeline_key, pipeline_label in [
            ("current", "current"),
            ("skill_openalex", "openalex"),
            ("current_plus_openalex", "current_plus_openalex"),
        ]:
            for entry in results[pipeline_key]["per_query"]:
                rows.append({
                    "pipeline": pipeline_label,
                    "query": entry["query"],
                    "total": entry["total"],
                    "unique": entry["unique"],
                    "dedupe_rate": round(entry["dedupe_rate"], 4),
                    "relevance_avg": round(entry["relevance_avg"], 2),
                    "age_avg": round(entry["age_avg"], 2) if entry["age_avg"] is not None else "",
                    "recency_avg": round(entry["recency_avg"], 2) if entry["recency_avg"] is not None else "",
                })

            summary = results[pipeline_key]
            rows.append({
                "pipeline": pipeline_label,
                "query": "__summary__",
                "total": "",
                "unique": round(summary["avg_coverage"], 2),
                "dedupe_rate": round(summary["avg_dedupe_rate"], 4),
                "relevance_avg": round(summary["avg_relevance"], 2),
                "age_avg": round(summary["avg_age"], 2) if summary["avg_age"] is not None else "",
                "recency_avg": round(summary["avg_recency"], 2) if summary["avg_recency"] is not None else "",
            })

        with open(args.csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "pipeline",
                    "query",
                    "total",
                    "unique",
                    "dedupe_rate",
                    "relevance_avg",
                    "age_avg",
                    "recency_avg",
                ],
            )
            writer.writeheader()
            writer.writerows(rows)

        print(f"\nCSV written: {args.csv_path}")


if __name__ == "__main__":
    main()
