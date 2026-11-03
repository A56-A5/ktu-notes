import {getAsset} from './db';
import {exportDoc} from './io';
// Portable backup: data.json (hierarchy + note HTML, images as asset:<id>) plus assets/<id>.<ext>.
export async function exportZip(nodes,rootId,name){
 const JSZip=(await import('jszip')).default;const doc=exportDoc(nodes,rootId);
 const ids=[...new Set(JSON.stringify(doc).match(/asset:[a-z0-9]+/g)||[])];
 const zip=new JSZip();doc.assets=[];let missing=0;
 for(const m of ids){const id=m.slice(6),a=await getAsset(id);if(!a){missing++;continue}
  const ext=((a.type||'image/png').split('/')[1]||'png').split('+')[0],file=`assets/${id}.${ext}`;
  zip.file(file,a.blob);doc.assets.push({id,file,name:a.name,type:a.type})}
 zip.file('data.json',JSON.stringify(doc,null,2));
 const blob=await zip.generateAsync({type:'blob'});
 const el=document.createElement('a');el.href=URL.createObjectURL(blob);el.download=`ktu-${name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.zip`;el.click();URL.revokeObjectURL(el.href);
 return{images:doc.assets.length,missing};
}
