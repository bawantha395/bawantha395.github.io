#!/usr/bin/env python3
"""Copies the site into _site and writes build.json (run number, commit and Lighthouse scores) for the footer badge."""
import json, os, pathlib, shutil, glob

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
SKIP = {'.git', '.github', 'scripts', '_site', '.lighthouseci', 'node_modules', '.DS_Store'}
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir()
for item in ROOT.iterdir():
    if item.name in SKIP or item.suffix == '.md': continue
    (shutil.copytree if item.is_dir() else shutil.copy2)(item, OUT / item.name)
(OUT / '.nojekyll').write_text('')

info = {'run': os.getenv('GITHUB_RUN_NUMBER', ''), 'sha': os.getenv('GITHUB_SHA', '')[:7], 'built': os.getenv('BUILD_DATE', '')}
repo, run_id, server = os.getenv('GITHUB_REPOSITORY'), os.getenv('GITHUB_RUN_ID'), os.getenv('GITHUB_SERVER_URL', 'https://github.com')
if repo and run_id: info['url'] = f'{server}/{repo}/actions/runs/{run_id}'
reports = sorted(glob.glob(str(ROOT / '.lighthouseci' / 'lhr-*.json')))
if reports:
    cats = json.load(open(reports[0]))['categories']
    info['lighthouse'] = {k.replace('best-practices', 'bestPractices'): round(v['score'] * 100) for k, v in cats.items() if v.get('score') is not None}
(OUT / 'build.json').write_text(json.dumps(info, indent=2) + '\n')
print('built', info)
