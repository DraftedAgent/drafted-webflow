"""Compare browser-produced fixture exports; no PDF authoring or backend calls."""
import json, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageChops
from pypdf import PdfReader
import pdfplumber

out = Path(__file__).resolve().parents[1] / 'output/pdf/standalone'
results = []
for count in (1, 42):
    for design in ('classic_v1', 'compact_v1'):
        files = [out / f'{kind}-{count}-{design}.pdf' for kind in ('published', 'standalone')]
        readers = [PdfReader(p) for p in files]
        assert len(readers[0].pages) == len(readers[1].pages)
        positions = []
        for file in files:
            with pdfplumber.open(file) as pdf:
                positions.append([page.extract_words() for page in pdf.pages])
        assert positions[0] == positions[1], (count, design, 'word positions')
        with tempfile.TemporaryDirectory(prefix='drafted-pdf-') as temp:
            for index, file in enumerate(files):
                subprocess.run(['pdftoppm', '-r', '96', '-png', str(file), str(Path(temp)/str(index))], check=True, capture_output=True)
            for page, (a, b) in enumerate(zip(sorted(Path(temp).glob('0-*.png')), sorted(Path(temp).glob('1-*.png')))):
                assert readers[0].pages[page].mediabox == readers[1].pages[page].mediabox
                left, right = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
                assert left.size == right.size and ImageChops.difference(left, right).getbbox() is None, (count, design, page, 'pixels')
                if count == 42 and design == 'classic_v1':
                    right.save(out / f'pdf-page-{page+1}.png')
        results.append(dict(fixture=count, design=design, pages=len(readers[0].pages), sameTextAndCoordinates=True, pixelIdentical=True))
(out / 'pdf-equivalence.json').write_text(json.dumps(results, indent=2))
print(json.dumps(results))
