/* Deterministic synthetic PDF bytes for local preview/tests; never production data. */
(function(root){
  function create({pages=2,title='Synthetic original CV',landscape=false}={}){
    const hex=text=>'<'+[...text].map(c=>(c.charCodeAt(0)&255).toString(16).padStart(2,'0')).join('')+'>';
    const objects=['','<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
    const kids=[];
    for(let i=0;i<pages;i++){
      const n=4+i*3,w=landscape&&i===pages-1?842:595,h=landscape&&i===pages-1?595:842;kids.push(n+' 0 R');
      const lines=[title,'Åsa Example - Göteborg, Sweden','asa@example.org','Original source content, unchanged by Drafted.','Experience','Product specialist at Example Studio','Worked with designers and engineers.','Built a synthetic service (with users).','https://example.org/portfolio'];
      let content='0.15 0.28 0.35 RG 60 '+(h-110)+' m '+(w-60)+' '+(h-110)+' l S\n';
      for(let j=0;j<lines.length;j++)content+='BT /F1 '+(j===0?24:13)+' Tf 60 '+(h-65-j*40)+' Td '+hex(lines[j])+' Tj ET\n';
      content+='0.2 0.45 0.65 rg 60 90 100 35 re f\n0 0 0 rg BT /F1 11 Tf 60 40 Td '+hex('Page '+(i+1)+' of '+pages)+' Tj ET\n';
      objects[n]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+w+' '+h+'] /Resources << /Font << /F1 3 0 R >> >> /Contents '+(n+1)+' 0 R /Annots ['+(n+2)+' 0 R] >>';
      objects[n+1]='<< /Length '+content.length+' >>\nstream\n'+content+'endstream';
      objects[n+2]='<< /Type /Annot /Subtype /Link /Rect [60 '+(h-390)+' 270 '+(h-370)+'] /Border [0 0 0] /A << /S /URI /URI (https://example.org/portfolio) >> >>';
    }
    objects[2]='<< /Type /Pages /Count '+pages+' /Kids ['+kids.join(' ')+'] >>';
    let pdf='%PDF-1.4\n',offsets=[0];
    for(let n=1;n<objects.length;n++){offsets[n]=pdf.length;pdf+=n+' 0 obj\n'+objects[n]+'\nendobj\n';}
    const xref=pdf.length;pdf+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
    for(let n=1;n<objects.length;n++)pdf+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';
    return new TextEncoder().encode(pdf+'trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  }
  if(typeof module==='object')module.exports={create};else root.DraftedSyntheticPdf={create};
})(typeof window==='object'?window:globalThis);
