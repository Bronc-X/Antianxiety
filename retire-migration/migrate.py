from __future__ import annotations
import sys
from pathlib import Path
from typing import Optional, Union, List, Tuple, Dict, Any, Set
import pandas as pd
import yaml


def _to_numeric_series(s: Any) -> pd.Series:
    if isinstance(s, pd.Series):
        return pd.to_numeric(s, errors="coerce")
    return pd.Series([], dtype=float)


def load_config(cfg_path: Path) -> dict:
    with open(cfg_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def read_table(path: Path, sheet: Optional[Union[str, int]] = None) -> pd.DataFrame:
    suf = path.suffix.lower()
    if suf in {".xlsx", ".xls"}:
        return pd.read_excel(path, sheet_name=sheet)
    if suf in {".csv"}:
        return pd.read_csv(path)
    raise ValueError(f"Unsupported file type: {suf}")


def ensure_columns(df: pd.DataFrame, cols: List[str], text_cols: Set[str]) -> pd.DataFrame:
    for c in cols:
        if c not in df.columns:
            df[c] = "" if c in text_cols else 0
    return df


def compute_columns_before_rename(df: pd.DataFrame, group_cfg: Dict[str, Any]) -> pd.DataFrame:
    comp = group_cfg.get("computed", {})

    # 临时性保留额：按老列名求和
    hold_cfg = comp.get("临时性保留额", {})
    sum_cols: List[str] = hold_cfg.get("sum_of", []) or []
    if sum_cols:
        acc = None
        for c in sum_cols:
            s = _to_numeric_series(df[c]) if c in df.columns else pd.Series(0, index=df.index, dtype=float)
            acc = s if acc is None else acc + s
        df["临时性保留额"] = (acc if acc is not None else pd.Series(0, index=df.index, dtype=float)).fillna(0)

    # 扣款合计：是否并入 扣公积金
    ded_cfg = comp.get("扣款合计", {})
    if ded_cfg:
        source_col = ded_cfg.get("source_col", "扣款合计")
        hf_col = ded_cfg.get("housing_fund_col", "扣公积金")
        include_hf = bool(ded_cfg.get("include_deduct_housing_fund", False))
        base = _to_numeric_series(df[source_col]) if source_col in df.columns else pd.Series(0, index=df.index, dtype=float)
        if include_hf:
            hf = _to_numeric_series(df[hf_col]) if hf_col in df.columns else pd.Series(0, index=df.index, dtype=float)
            df["扣款合计"] = (base.fillna(0) + hf.fillna(0)).fillna(0)
        else:
            df["扣款合计"] = base.fillna(0)

    return df


def apply_rename(df: pd.DataFrame, rename_map: Dict[str, str]) -> pd.DataFrame:
    # 仅重命名存在的列
    effective = {k: v for k, v in rename_map.items() if k in df.columns}
    return df.rename(columns=effective)


def apply_constants(df: pd.DataFrame, constants: Dict[str, Any]) -> pd.DataFrame:
    for k, v in (constants or {}).items():
        df[k] = v
    return df


def apply_defaults(df: pd.DataFrame, defaults: Dict[str, Any]) -> pd.DataFrame:
    # fillna_zero: 将指定列缺失或空值填0；列不存在则创建为0
    fill_zero_cols: List[str] = (defaults or {}).get("fillna_zero", []) or []
    for c in fill_zero_cols:
        if c not in df.columns:
            df[c] = 0
        df[c] = _to_numeric_series(df[c]).fillna(0)
    return df


def cast_numeric_for_template(df: pd.DataFrame, template_cols: List[str], text_cols: Set[str]) -> pd.DataFrame:
    for c in template_cols:
        if c in text_cols:
            continue
        if c in df.columns:
            df[c] = _to_numeric_series(df[c]).fillna(0)
    return df


def validate_output(df: pd.DataFrame, text_cols: Set[str]) -> Tuple[Dict[str, Any], Dict[str, pd.DataFrame]]:
    issues: Dict[str, Any] = {}
    details: Dict[str, pd.DataFrame] = {}

    code_col = "职员代码"
    name_col = "职员姓名"

    dup_mask = df.duplicated(subset=[code_col, name_col], keep=False) if code_col in df.columns and name_col in df.columns else pd.Series([], dtype=bool)
    issues["duplicate_rows_by_code_name"] = int(dup_mask.sum()) if len(dup_mask) else 0
    if len(dup_mask) and dup_mask.any():
        details["dup_code_name"] = df.loc[dup_mask, [code_col, name_col]].copy()

    # 一致性：一个职员代码是否对应多个姓名；一个姓名是否对应多个职员代码
    if code_col in df.columns and name_col in df.columns:
        g1 = df.groupby(code_col)[name_col].nunique(dropna=False)
        code_multi = g1[g1 > 1].to_frame("name_nunique").reset_index()
        issues["code_to_multi_names_count"] = int((g1 > 1).sum())
        if not code_multi.empty:
            details["code_multi_names"] = code_multi

        g2 = df.groupby(name_col)[code_col].nunique(dropna=False)
        name_multi = g2[g2 > 1].to_frame("code_nunique").reset_index()
        issues["name_to_multi_codes_count"] = int((g2 > 1).sum())
        if not name_multi.empty:
            details["name_multi_codes"] = name_multi

    # 必填空值
    for key in [code_col, name_col]:
        if key in df.columns:
            null_cnt = int(df[key].isna().sum())
            empty_cnt = int((df[key] == "").sum() if df[key].dtype == object else 0)
            issues[f"empty_{key}"] = null_cnt + empty_cnt

    # 合计平衡检查：应发 - 扣款 - 实发 ~= 0
    if all(col in df.columns for col in ["应发合计", "扣款合计", "实发合计"]):
        diff = _to_numeric_series(df["应发合计"]) - _to_numeric_series(df["扣款合计"]) - _to_numeric_series(df["实发合计"])
        abs_diff = diff.abs()
        tol = 0.01
        issues["balance_out_of_tol_count"] = int((abs_diff > tol).sum())
        issues["balance_max_abs_diff"] = float(abs_diff.max() if len(abs_diff) else 0)
        outlier_mask = abs_diff > tol
        if outlier_mask.any():
            tmp = df.loc[outlier_mask, [code_col, name_col, "应发合计", "扣款合计", "实发合计"]].copy()
            tmp["差额"] = diff[outlier_mask]
            details["balance_outliers"] = tmp
    else:
        issues["balance_check_skipped"] = True

    return issues, details


def migrate_group(group: Dict[str, Any], template_cols: List[str], text_cols: Set[str], base_dir: Path) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    def _resolve(p: Any) -> Path:
        p = Path(p)
        return p if p.is_absolute() else (base_dir / p).resolve()

    src_path = _resolve(group["input_path"])
    sheet = group.get("input_sheet")
    out_path = _resolve(group["output_path"])

    if not src_path.exists():
        raise FileNotFoundError(f"Input not found: {src_path}")

    df = read_table(src_path, sheet)
    # 统一列名去两端空格
    df.columns = [str(c).strip() for c in df.columns]

    # 1) 先按老列名计算
    df = compute_columns_before_rename(df, group)

    # 2) 重命名到新模板列
    df = apply_rename(df, group.get("rename_map", {}))

    # 3) 常量列
    df = apply_constants(df, group.get("constants", {}))

    # 4) 默认值/缺失填充
    df = apply_defaults(df, group.get("defaults", {}))

    # 5) 丢弃不再需要的列
    for col in group.get("drop_columns", []) or []:
        if col in df.columns:
            df = df.drop(columns=[col])

    # 6) 补齐并排序为模板列
    df = ensure_columns(df, template_cols, text_cols)
    df = cast_numeric_for_template(df, template_cols, text_cols)
    df = df.reindex(columns=template_cols)

    # 7) 校验
    issues, details = validate_output(df, text_cols)

    # 8) 导出
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="data", index=False)
        # 校验报告
        rep_rows = [{"key": k, "value": v} for k, v in issues.items()]
        pd.DataFrame(rep_rows).to_excel(writer, sheet_name="validation", index=False)
        for k, ddf in details.items():
            if isinstance(ddf, pd.DataFrame) and not ddf.empty:
                safe = k.replace(":", "_").replace("/", "_").replace("\\", "_").replace("?", "_").replace("*", "_").replace("[", "(").replace("]", ")")
                if len(safe) > 31:
                    safe = safe[:31]
                ddf.to_excel(writer, sheet_name=safe, index=False)

    return df, issues


def main(argv: List[str]) -> int:
    cfg_path = Path(argv[1]) if len(argv) > 1 else Path(__file__).with_name("config.yaml")
    cfg = load_config(cfg_path)

    template_cols: List[str] = cfg.get("template_columns", [])
    if not template_cols:
        print("[ERROR] template_columns missing in config.yaml")
        return 2
    text_cols: Set[str] = set(cfg.get("text_columns", []))

    groups: List[Dict[str, Any]] = cfg.get("groups", [])
    if not groups:
        print("[ERROR] groups is empty in config.yaml")
        return 2

    overall: Dict[str, Dict[str, Any]] = {}
    base_dir = cfg_path.parent
    for g in groups:
        name = g.get("name", str(len(overall)+1))
        print(f"[INFO] Migrating group: {name}")
        try:
            _, issues = migrate_group(g, template_cols, text_cols, base_dir)
            overall[name] = issues
            print(f"[OK]  {name} -> done. Issues: {issues}")
        except Exception as e:
            overall[name] = {"error": str(e)}
            print(f"[FAIL] {name}: {e}")

    # 汇总输出
    print("\n=== SUMMARY ===")
    for name, info in overall.items():
        print(name, "->", info)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
