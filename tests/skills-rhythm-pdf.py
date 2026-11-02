"""Read-only validation/rasterization of the actual browser print-DOM PDFs."""
import argparse,json,re,unicodedata,subprocess,concurrent.futures
from pathlib import Path
from pypdf import PdfReader
parser=argparse.ArgumentParser();parser.add_argument('--pdftoppm',required=True);args=parser.parse_args()
out=Path('output/pdf/standalone/skills-rhythm');rows=json.loads((out/'results.json').read_text(encoding='utf-8'));reports=[]
normalize=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
for row in rows:
 pdf=out/row['pdf'];reader=PdfReader(pdf)
 assert len(reader.pages)==row['pages'],(pdf,len(reader.pages),row['pages'])
 for page in reader.pages:assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
 text=normalize('\n'.join(p.extract_text() or '' for p in reader.pages))
 for line in row['sourceText'].splitlines():
  if line.strip():assert text.count(normalize(line))==1,(pdf,line,text.count(normalize(line)))
 reports.append({'file':row['pdf'],'pages':len(reader.pages),'a4':True,'eachSkillsLineExactlyOnce':True,'appliedAdditionsPreserved':True})
def render(row):
 result=subprocess.run([args.pdftoppm,'-r','96','-png',str(out/row['pdf']),str(out/(row['name']+'-pdf'))],capture_output=True,text=True)
 assert result.returncode==0,result.stderr
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(render,rows))
(out/'pdf-verification.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
print(json.dumps(reports))
