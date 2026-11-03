#!/usr/bin/env python3
"""Quality gate for the portfolio. Fails the build on broken links or assets and on anything that looks like a secret.
Prints warnings (without failing) for sentences that contain a colon or semicolon."""
import html, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'.git', '.github', 'scripts', '_site', '.lighthouseci', 'node_modules'}
TEXT = {'.html', '.js', '.css', '.json', '.md', '.txt', '.yml', '.yaml'}
files = [p for p in ROOT.rglob('*') if p.is_file() and not (set(p.relative_to(ROOT).parts) & SKIP)]
errors, warnings = [], []

# 1. every local asset and page reference must exist
ref = re.compile(r'''(?:href|src|data-src|data-evidence|poster)=["']([^"'#?][^"']*)["']''')
asset = re.compile(r'assets/[A-Za-z0-9_./%-]+\.(?:png|jpe?g|webp|svg|pdf|woff2?|json|txt)')
for p in files:
    if p.suffix not in {'.html', '.js', '.css'}: continue
    t = p.read_text(errors='ignore')
    found = set(asset.findall(t) and [m.group(0) for m in asset.finditer(t)])
    for r in ref.findall(t):
        if re.match(r'(https?:|mailto:|tel:|data:|javascript:)', r): continue
        found.add(r.split('?')[0])
    for f in found:
        if f.startswith('assets/') or f.endswith(('.html', '.css', '.js')):
            if not (ROOT / f).exists() and not (p.parent / f).exists(): errors.append(f'{p.relative_to(ROOT)} points to a missing file: {f}')

# 2. in-page anchors must have a matching id
index = (ROOT / 'index.html').read_text()
ids = set(re.findall(r'\sid="([^"]+)"', index))
for a in set(re.findall(r'href="#([^"]+)"', index)):
    if a not in ids: errors.append(f'index.html links to #{a} but no element has that id')

# 3. secrets and private identifiers
rules = [(r'\b\d{12}\b', 'a 12 digit number (looks like an AWS account ID)'), (r'AKIA[0-9A-Z]{16}', 'an AWS access key ID'), (r'-----BEGIN [A-Z ]*PRIVATE KEY-----', 'a private key'),
         (r'(?i)(password|passwd|secret)\s*[:=]\s*["\'][^"\']{4,}["\']', 'a hard-coded password or secret'),
         (r'\b(?!10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.0\.0\.0)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', 'a public IPv4 address')]
for p in files:
    if p.suffix not in TEXT or p.name == 'check_site.py': continue
    t = p.read_text(errors='ignore')
    for pat, label in rules:
        for m in re.finditer(pat, t):
            ctx = t[max(0, m.start() - 30):m.end() + 10].replace('\n', ' ')
            if 'tel:' in ctx or 'viewbox' in ctx.lower(): continue
            errors.append(f'{p.relative_to(ROOT)} contains {label}: ...{ctx}...')

# 4. house style: no colon or semicolon inside visible sentences (warning only)
vis = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>|<noscript.*?</noscript>', '', index, flags=re.S)
seen = set()
for m in re.finditer(r'<(p|li|h[1-4]|figcaption)[^>]*>(.*?)</\1>', vis, re.S):
    t = html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip()
    if t in seen or len(t) < 12: continue
    seen.add(t)
    if re.search(r'[:;]', re.sub(r'\b\d{1,2}:\d{2}\b', '', t)): warnings.append('colon or semicolon in text: ' + t[:90])

for w in warnings: print('WARNING', w)
for e in errors: print('ERROR  ', e)
print(f'{len(files)} files checked, {len(errors)} errors, {len(warnings)} warnings')
sys.exit(1 if errors else 0)
