from pathlib import Path
from pypdf import PdfReader
import json, subprocess, tempfile, re
from PIL import Image, ImageChops, ImageStat
results=json.loads(Path('tmp/pdfs/portrait/results.json').read_text())
for item in results:
    pdf=PdfReader('output/pdf/portrait/'+item['name']+'.pdf')
    assert len(pdf.pages)==item['pages'],item
    assert len(pdf.pages)>1,item
    images=[len(page.images) for page in pdf.pages]
    assert images==([1]+[0]*(len(pdf.pages)-1) if item['photoWidth'] else [0]*len(pdf.pages)),(item,images)
    assert all(page.extract_text().strip() for page in pdf.pages)
    # Read in geometric order, removing page labels before joining split sentences.
    text=' '.join(re.sub(r'(?m)^\s*\d+ / \d+\s*$', '', page.extract_text(extraction_mode='layout')) for page in pdf.pages)
    assert 'Alexandra' in text
    assert 'Add photo' not in text and 'Change photo' not in text
    normalized=''.join(text.split())
    assert normalized.count('Coordinateduserinterviewsanddocumentedprojectfindingsforthedeliveryteam.')==28
    assert 'Documentedapersonalproject.' in normalized
    if item.get('photoBox'):
        with tempfile.TemporaryDirectory(prefix='drafted-photo-pdf-') as directory:
            target=Path(directory)/'page'
            subprocess.run(['pdftoppm','-f','1','-singlefile','-r','96','-png','output/pdf/portrait/'+item['name']+'.pdf',str(target)],check=True,capture_output=True)
            raster=Image.open(str(target)+'.png').convert('RGB')
            preview=Image.open('tmp/pdfs/portrait/'+item['name']+'.png').convert('RGB')
            b=item['photoBox'];box=(round(b['x'])+2,round(b['y'])+2,round(b['x']+b['width'])-2,round(b['y']+b['height'])-2)
            actual=raster.crop(box);expected=preview.crop(box)
            difference=ImageStat.Stat(ImageChops.difference(actual,expected)).mean
            assert max(difference)<6,(item['name'],'PDF crop/shape differs from preview',difference)
    print(item['name'],len(pdf.pages),'pages, image objects',images)
print('PASS twenty actual PDFs match measured pages; portraits first page only, no blank pages')
