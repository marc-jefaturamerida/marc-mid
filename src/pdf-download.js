/** Jefatura Mid Marc V3.0. PDF descargable (sin diálogo de impresión).
 * Cada canvas se incrusta en una página carta. No se envían datos al servidor.
 */
const encoder=new TextEncoder();
const ascii=s=>encoder.encode(s);
const join=chunks=>{const total=chunks.reduce((n,x)=>n+x.length,0);const out=new Uint8Array(total);let offset=0;for(const x of chunks){out.set(x,offset);offset+=x.length;}return out;};
export function pdfSafeName(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,' ').trim().replace(/\s+/g,'_').replace(/_+/g,'_').slice(0,145)||'Reporte';}
export function canvasesToPdf(canvases,{landscape=false,quality=.86}={}){
 if(!Array.isArray(canvases)||!canvases.length)throw Error('No hay páginas del reporte para convertir a PDF.');
 if(canvases.length>120)throw Error('El reporte excede 120 páginas. Selecciona un período menor.');
 const media=landscape?[792,612]:[612,792],objects=[null];
 const allocate=()=>{objects.push(null);return objects.length-1;};
 const root=allocate(),pages=allocate(),kids=[];
 for(const canvas of canvases){
  if(!canvas?.width||!canvas?.height)throw Error('Una página del reporte está vacía.');
  const url=canvas.toDataURL('image/jpeg',quality);
  if(!url.startsWith('data:image/jpeg;base64,'))throw Error('El navegador no pudo convertir el reporte a JPEG.');
  const raw=atob(url.split(',')[1]);const image=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)image[i]=raw.charCodeAt(i);
  const imgId=allocate(),contentId=allocate(),pageId=allocate();kids.push(pageId);
  const [pw,ph]=media,ratio=Math.min(pw/canvas.width,ph/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
  const x=(pw-w)/2,y=(ph-h)/2;
  const command=`q ${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm /Img0 Do Q\n`;
  objects[imgId]=join([ascii(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),image,ascii('\nendstream')]);
  objects[contentId]=ascii(`<< /Length ${ascii(command).length} >>\nstream\n${command}endstream`);
  objects[pageId]=ascii(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Img0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`);
 }
 objects[root]=ascii(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
 objects[pages]=ascii(`<< /Type /Pages /Kids [${kids.map(id=>id+' 0 R').join(' ')}] /Count ${kids.length} >>`);
 const chunks=[ascii('%PDF-1.4\n%JM30\n')],offsets=[0];let length=chunks[0].length;
 for(let i=1;i<objects.length;i++){
  offsets[i]=length;const chunk=join([ascii(`${i} 0 obj\n`),objects[i],ascii('\nendobj\n')]);chunks.push(chunk);length+=chunk.length;
 }
 const xref=length;
 chunks.push(ascii(`xref\n0 ${objects.length}\n0000000000 65535 f \n`));
 for(let i=1;i<objects.length;i++)chunks.push(ascii(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));
 chunks.push(ascii(`trailer\n<< /Size ${objects.length} /Root ${root} 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
 return new Blob(chunks,{type:'application/pdf'});
}
export function downloadPdfCanvases(canvases,filename,options={}){
 const pdf=canvasesToPdf(canvases,options),url=URL.createObjectURL(pdf),link=document.createElement('a');
 link.href=url;link.download=pdfSafeName(filename).replace(/\.pdf$/i,'')+'.pdf';
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 return link.download;
}
