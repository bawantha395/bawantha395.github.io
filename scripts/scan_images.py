#!/usr/bin/env python3
"""Reads the text in every screenshot (OCR) and fails if an AWS account ID, access key or public IP is visible.
Needs the tesseract program (sudo apt-get install -y tesseract-ocr)."""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
bad = [(re.compile(r'\b\d{12}\b'), 'AWS account ID'), (re.compile(r'7\d{3}\s?\d{4}\s?\d{4}'), 'AWS account ID'), (re.compile(r'AKIA[0-9A-Z]{16}'), 'AWS access key'),
       (re.compile(r'\b(?!10\.|127\.|192\.168\.|0\.0\.0\.0|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:/\d+)?\b'), 'public IP address')]
problems = 0
images = [p for p in sorted((ROOT / 'assets').rglob('*')) if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'} and 'tool-icons' not in p.parts and p.name != 'og-image.jpg']
for img in images:
    text = subprocess.run(['tesseract', str(img), '-', '--psm', '11'], capture_output=True, text=True).stdout
    # an ARN or URL often splits the number, so also test with spaces and line breaks removed
    flat = re.sub(r'\s+', '', text)
    for rx, label in bad:
        hit = rx.search(text) or (label == 'AWS account ID' and re.search(r'(?:arn:aws:[a-z0-9-]+:[a-z0-9-]*:|^|[/-])(\d{12})(?!\d)', flat))
        if hit:
            problems += 1; print(f'ERROR   {img.relative_to(ROOT)} shows a {label}: {hit.group(0)[:40]}')
import tempfile
for pdf in sorted((ROOT / 'assets').glob('*.pdf')):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-r', '120', '-png', str(pdf), tmp + '/page'], capture_output=True)
        for page in sorted(pathlib.Path(tmp).glob('*.png')):
            text = subprocess.run(['tesseract', str(page), '-', '--psm', '11'], capture_output=True, text=True).stdout
            hit = re.search(r'(?<![\w-])\d{12}(?![\w-])', text)
            if hit: problems += 1; print(f'ERROR   {pdf.name} {page.name} shows a 12 digit number: {hit.group(0)}')
print(f'{len(images)} screenshots and the PDFs scanned, {problems} problems')
sys.exit(1 if problems else 0)
