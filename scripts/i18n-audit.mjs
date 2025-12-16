import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function extractObjectLiteral(node) {
  if (!node) return null;
  if (ts.isAsExpression(node)) return extractObjectLiteral(node.expression);
  if (ts.isParenthesizedExpression(node)) return extractObjectLiteral(node.expression);
  if (ts.isObjectLiteralExpression(node)) return node;
  return null;
}

function getPropName(nameNode) {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNoSubstitutionTemplateLiteral(nameNode)) return nameNode.text;
  return null;
}

function parseTranslations() {
  const filePath = path.join(repoRoot, 'lib/i18n-dict.ts');
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let rootObj = null;
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      if (decl.name.text !== 'translations') continue;
      rootObj = extractObjectLiteral(decl.initializer);
    }
  }
  if (!rootObj) throw new Error('Could not find translations object in lib/i18n-dict.ts');

  const localeKeys = {};
  for (const prop of rootObj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const locale = getPropName(prop.name);
    const localeObj = extractObjectLiteral(prop.initializer);
    if (!locale || !localeObj) continue;
    const keys = [];
    for (const p of localeObj.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const k = getPropName(p.name);
      if (!k) continue;
      keys.push(k);
    }
    localeKeys[locale] = new Set(keys);
  }

  return localeKeys;
}

function listFiles(rootDir, predicate) {
  const out = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && predicate(p)) out.push(p);
    }
  }
  walk(path.join(repoRoot, rootDir));
  return out;
}

function extractTKeysFromFile(fileText) {
  const keys = new Set();
  const re = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let m;
  while ((m = re.exec(fileText))) {
    keys.add(m[1]);
  }
  return keys;
}

function extractTrObjectsFromFile(fileText) {
  const results = [];
  // Very lightweight check: ensure tr(..., { zh: ..., en: ... }) includes both.
  const re = /\btr\(\s*[^,]+,\s*\{([\s\S]*?)\}\s*\)/g;
  let m;
  while ((m = re.exec(fileText))) {
    const body = m[1];
    const hasZh = /\bzh\s*:/.test(body);
    const hasEn = /\ben\s*:/.test(body);
    results.push({ hasZh, hasEn });
  }
  return results;
}

function routeFromPageFile(pageFile) {
  const rel = path.posix.relative('app', pageFile);
  const dir = path.posix.dirname(rel);
  return dir === '.' ? '/' : `/${dir}`;
}

function getStaticImports(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const kind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, kind);
  const imports = [];
  sf.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    }
  });
  return imports;
}

const exts = ['.ts', '.tsx', '.js', '.jsx'];
function resolveLocalImport(fromFile, spec) {
  let candidate;
  if (spec.startsWith('@/')) candidate = path.join(repoRoot, spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../')) candidate = path.resolve(path.dirname(fromFile), spec);
  else return null;

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  for (const ext of exts) {
    const f = candidate + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    for (const ext of exts) {
      const f = path.join(candidate, 'index' + ext);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
  }
  return null;
}

function analyzeImportGraph(entryFile) {
  const stack = [entryFile];
  const visited = new Set();
  const markers = {
    useI18n: false,
    tr: false,
    getServerLanguage: false,
    tKey: false,
    hasEnglishBranch: false,
  };

  while (stack.length) {
    const f = stack.pop();
    if (!f || visited.has(f)) continue;
    visited.add(f);
    if (f.includes(`${path.sep}node_modules${path.sep}`)) continue;
    let text = '';
    try {
      text = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (text.includes('useI18n(')) markers.useI18n = true;
    if (text.includes('tr(')) markers.tr = true;
    if (text.includes('getServerLanguage')) markers.getServerLanguage = true;
    if (text.includes("t('")) markers.tKey = true;
    if (text.includes("language === 'en'") || text.includes('language==="en"') || text.includes('language !== \'en\'')) {
      markers.hasEnglishBranch = true;
    }

    let specs = [];
    try {
      specs = getStaticImports(f);
    } catch {
      specs = [];
    }
    for (const spec of specs) {
      const resolved = resolveLocalImport(f, spec);
      if (resolved) stack.push(resolved);
    }
  }

  return { visitedCount: visited.size, markers };
}

function main() {
  const localeKeys = parseTranslations();
  const locales = Object.keys(localeKeys).sort();

  const zh = localeKeys.zh ?? new Set();
  const en = localeKeys.en ?? new Set();

  const missingEn = [...zh].filter((k) => !en.has(k));
  const missingZh = [...en].filter((k) => !zh.has(k));

  const codeFiles = [
    ...listFiles('app', (p) => /\.(t|j)sx?$/.test(p)),
    ...listFiles('components', (p) => /\.(t|j)sx?$/.test(p)),
    ...listFiles('lib', (p) => /\.(t|j)sx?$/.test(p)),
    ...listFiles('hooks', (p) => /\.(t|j)sx?$/.test(p)),
  ];

  const usedKeys = new Set();
  let trMissingEnCount = 0;
  for (const abs of codeFiles) {
    const txt = fs.readFileSync(abs, 'utf8');
    for (const k of extractTKeysFromFile(txt)) usedKeys.add(k);
    for (const trObj of extractTrObjectsFromFile(txt)) {
      if (trObj.hasZh && !trObj.hasEn) trMissingEnCount++;
    }
  }

  const usedKeysArr = [...usedKeys].sort();
  const isDynamicKey = (k) => k.includes('${');
  const missingInZhForUsed = usedKeysArr.filter((k) => !isDynamicKey(k) && !zh.has(k));
  const missingInEnForUsed = usedKeysArr.filter((k) => !isDynamicKey(k) && !en.has(k));

  const pages = listFiles('app', (p) => /page\.(t|j)sx$/.test(p)).map((abs) => path.posix.relative(repoRoot, abs).replace(/\\/g, '/')).sort();

  const routeStats = [];
  for (const pageRel of pages) {
    const route = routeFromPageFile(pageRel);
    const isDev = route.startsWith('/test-') || route.startsWith('/debug');
    const graph = analyzeImportGraph(path.join(repoRoot, pageRel));
    routeStats.push({
      route,
      page: pageRel,
      isDev,
      importGraphFiles: graph.visitedCount,
      markers: graph.markers,
    });
  }

  const prodRoutes = routeStats.filter((r) => !r.isDev);
  const devRoutes = routeStats.filter((r) => r.isDev);

  const prodEnglishLikely = prodRoutes.filter((r) => r.markers.tKey || r.markers.tr || r.markers.hasEnglishBranch).length;
  const prodZhTwLikely = prodRoutes.filter((r) => r.markers.tr || r.markers.useI18n || r.markers.getServerLanguage).length;

  const result = {
    translations: Object.fromEntries(locales.map((l) => [l, localeKeys[l]?.size ?? 0])),
    missingKeys: {
      missingEnVsZh: missingEn.length,
      missingZhVsEn: missingZh.length,
    },
    usage: {
      tKeyUsedCount: usedKeys.size,
      tKeyMissingInZh: missingInZhForUsed.length,
      tKeyMissingInEn: missingInEnForUsed.length,
      trCallsMissingEnFieldApprox: trMissingEnCount,
    },
    routes: {
      totalPages: pages.length,
      prodPages: prodRoutes.length,
      devPages: devRoutes.length,
      prodEnglishLikely,
      prodZhTwLikely,
    },
    notes: [
      'This audit is static: it cannot guarantee client-only text has rendered in-browser.',
      'zh-TW completeness is provided by OpenCC conversion fallback and DOM auto-convert.',
    ],
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
