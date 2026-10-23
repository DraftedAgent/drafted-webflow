"""Independent PDF text/font/link and raster QA against actual preview pages."""
import argparse
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageStat, ImageDraw
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('--pdftoppm', required=True)
parser.add_argument('--designs', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
results = []
normalize = lambda text: re.sub(r'\s+', '', unicodedata.normalize('NFKC', text))

proof_root = root / 'tmp/pdfs' / ('designs' if args.designs else '')
names = [r['fixture'] for r in json.loads((proof_root / 'browser-results.json').read_text(encoding='utf-8'))['results']]
for name in names:
    directory = proof_root / name
    expected = json.loads((directory / 'preview.json').read_text(encoding='utf-8'))
    assert expected['proofMatchesActualPreviewGeometry'], 'Proof must match actual editor geometry before PDF comparison'
    overview = []
    for variant, file in enumerate(expected['outputs']):
        reader = PdfReader(file)
        assert len(reader.pages) == len(expected['pages']), (name, 'page count')
        prefix = directory / ('pdf' if variant == 0 else 'pdf-mobile')
        subprocess.run([args.pdftoppm, '-r', '96', '-png', str(file), str(prefix)], check=True, capture_output=True)
        page_results = []
        links = []
        for i, page in enumerate(reader.pages):
            actual = page.extract_text()
            assert normalize(actual) == normalize(expected['pages'][i]['text']), (name, variant, i + 1, 'text/order mismatch')
            assert '\ufffd' not in actual, (name, i + 1, 'replacement character')
            assert len(page.images) == 0, (name, i + 1, 'rasterized content')
            assert not any(text in actual for text in ['Export PDF', 'Copy text', 'Experience questions', 'Full CV selected']), 'Editor UI leaked into PDF'
            font_names = []
            for font in page['/Resources']['/Font'].values():
                font = font.get_object()
                font_names.append(str(font['/BaseFont']))
                descendant = font.get('/DescendantFonts')
                descriptor = (descendant[0].get_object() if descendant else font).get('/FontDescriptor')
                assert descriptor and any(key in descriptor.get_object() for key in ['/FontFile', '/FontFile2', '/FontFile3']), 'Font not embedded'
                assert 'LiberationSans' in str(font['/BaseFont']), ('Unexpected font fallback', font['/BaseFont'])
            for annotation in page.get('/Annots', []):
                action = annotation.get_object().get('/A')
                if action and action.get('/S') == '/URI':
                    links.append(str(action['/URI']))
            preview = Image.open(directory / f'preview-{i+1}.png').convert('RGB')
            pdf = Image.open(f'{prefix}-{i+1}.png').convert('RGB')
            assert abs(preview.width - pdf.width) <= 1 and abs(preview.height - pdf.height) <= 1
            # PDF paper bounds can round to an adjacent pixel at 96 dpi.
            canvas = Image.new('RGB', preview.size, 'white')
            canvas.paste(pdf, (0, 0))
            diff = ImageChops.difference(preview, canvas)
            mae = sum(ImageStat.Stat(diff).mean) / 3
            blurred = ImageChops.difference(preview.convert('L').filter(ImageFilter.GaussianBlur(1)),
                                            canvas.convert('L').filter(ImageFilter.GaussianBlur(1)))
            blurred_mae = ImageStat.Stat(blurred).mean[0]
            ink_preview = preview.convert('L').point(lambda x: 255 if x < 210 else 0)
            ink_pdf = canvas.convert('L').point(lambda x: 255 if x < 210 else 0)
            expanded_preview = ink_preview.filter(ImageFilter.MaxFilter(5))
            expanded_pdf = ink_pdf.filter(ImageFilter.MaxFilter(5))
            missed_preview = ImageChops.subtract(ink_preview, expanded_pdf).histogram()[255]
            missed_pdf = ImageChops.subtract(ink_pdf, expanded_preview).histogram()[255]
            ink_count = ink_preview.histogram()[255] + ink_pdf.histogram()[255]
            overlap = 1 - (missed_preview + missed_pdf) / max(1, ink_count)
            # Screen LCD text and Poppler glyphs have different edge colors and
            # fractional baseline rounding. Raw pixel MAE is reported, not used
            # as a density-dependent acceptance threshold. No image is shifted
            # or rescaled: require symmetric ink agreement at a stated 2px
            # tolerance, matching bounds, and exact text/order independently.
            assert overlap > .99, (name, variant, i + 1, 'ink displacement', overlap)
            assert max(abs(a-b) for a, b in zip(ink_preview.getbbox(), ink_pdf.getbbox())) <= 2
            page_results.append({'page': i+1, 'textAndOrderEqual': True, 'images': 0, 'embeddedFonts': font_names,
                                 'meanAbsolutePixelDifference': round(mae, 4), 'inkMatchWithin2px': round(overlap, 6),
                                 'blurredMeanAbsoluteDifference': round(blurred_mae, 4),
                                 'previewInkBounds': ink_preview.getbbox(), 'pdfInkBounds': ink_pdf.getbbox(),
                                 'paperPoints': [float(page.mediabox.width), float(page.mediabox.height)]})
            if variant == 0:
                pair = Image.new('RGB', (preview.width * 2, preview.height + 26), '#e9edf0')
                pair.paste(preview, (0, 26)); pair.paste(canvas, (preview.width, 26))
                draw = ImageDraw.Draw(pair); draw.text((12, 7), f'{name} / page {i+1}: actual preview', fill='black')
                draw.text((preview.width + 12, 7), 'Exported PDF rendered independently by Poppler', fill='black')
                pair.save(directory / f'comparison-{i+1}.png')
                pair.thumbnail((800, 580)); overview.append(pair.copy())
        if expected.get('fixture', name) == 'long-special':
            assert 'https://example.org/portfolio' in links
            assert 'https://www.example.org/' in links
            assert 'mailto:alex@example.org' in links
            assert any(len(link) > 1000 for link in links), 'Long URL destination was truncated'
            special = '\n'.join(p.extract_text() for p in reader.pages)
            for text in ['Åsa Östergård', 'ÅÄÖ åäö', 'français', '€', 'α β Ω', 'FULL SOURCE RETAINED']:
                assert normalize(text) in normalize(special), ('Missing special text', text)
        if name == 'edited':
            assert 'Recently applied edit:' in reader.pages[0].extract_text()
        results.append({'fixture': name, 'variant': 'desktop' if variant == 0 else 'mobile',
                        'pages': page_results, 'linkAnnotations': len(links), 'searchableText': True,
                        'proofMatchesActualPreviewGeometry': True})
    sheet = Image.new('RGB', (800, sum(image.height for image in overview)), '#e9edf0')
    y = 0
    for image in overview:
        sheet.paste(image, (0, y)); y += image.height
    sheet.save(directory / 'comparison-all.png')

report = {'rendererComparison': 'Edge preview DOM vs Skia PDF rasterized with Poppler at 96 dpi', 'results': results,
          'limitations': ['Rasterizers differ in anti-aliasing; pixel identity is not claimed.',
                          'Chromium rounds physical page boxes by fractions of a point.',
                          'PDF creation timestamps vary; byte identity is not claimed.']}
(proof_root / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'pdfVariants': len(results), 'pagesCompared': sum(len(r['pages']) for r in results),
                  'maxMeanAbsolutePixelDifference': max(p['meanAbsolutePixelDifference'] for r in results for p in r['pages']),
                  'maxBlurredMeanAbsoluteDifference': max(p['blurredMeanAbsoluteDifference'] for r in results for p in r['pages']),
                  'minInkMatchWithin2px': min(p['inkMatchWithin2px'] for r in results for p in r['pages']),
                  'allTextAndPageCountsEqual': True, 'allFontsEmbedded': True, 'rasterizedPages': 0}))
