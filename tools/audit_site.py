from pathlib import Path
import re,sys
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'css/styles.css').read_text(encoding='utf-8')
js=(root/'js/app.js').read_text(encoding='utf-8')
image_refs=set(re.findall(r'assets/images/[A-Za-z0-9_.-]+',html+css))
for m in re.findall(r"file:\s*'([A-Za-z0-9_-]+\.webp)'", js): image_refs.add('assets/images/'+m)
for m in re.findall(r"image:\s*'([A-Za-z0-9_-]+\.webp)'", js): image_refs.add('assets/images/'+m)
missing=[r for r in sorted(image_refs) if not (root/r).is_file()]
webp=list((root/'assets/images').glob('*.webp'))
originals=list((root/'artwork/original-png').glob('*.png'))
print('HTML/CSS/JS image references:',len(image_refs))
print('Original PNGs:',len(originals),'WebP images (including thumbnails):',len(webp))
print('Missing image references:',missing)
print('Video elements:',len(re.findall(r'<video\b',html,flags=re.I)))
print('Wallet connect API references:',len(re.findall(r'eth_requestAccounts|window\.ethereum',js)))
if missing or len(originals)!=20 or len(webp)<20 or re.search(r'<video\b',html,flags=re.I):sys.exit(1)
print('PASS — asset and source audit')
