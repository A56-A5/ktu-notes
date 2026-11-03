'use client';
import {useState} from 'react';
import {uid,putAsset} from '../lib/db';
import {validate,flatten} from '../lib/io';

const Tree=({list,d=0,budget})=>list.map((n,i)=>budget.n--<=0?null:<div key={i} style={{paddingLeft:d*14}} className="text-sm">{n.type==='note'?'📄':'📁'} {n.title}{n.code&&` (${n.code})`}{n.children&&<Tree list={n.children} d={d+1} budget={budget}/>}</div>);

export default function IOModal({nodes,setNodes,targetId,targetTitle,onClose}){
 const [doc,setDoc]=useState(null),[errs,setErrs]=useState([]),[info,setInfo]=useState(null),[done,setDone]=useState(null),[zip,setZip]=useState(null);
 const pick=async(f)=>{if(!f)return;setDone(null);setZip(null);let data,z=null;
  try{let text;if(/\.zip$/i.test(f.name)){z=await (await import('jszip')).default.loadAsync(f);const e=z.file('data.json');if(!e)throw new Error('data.json not found in ZIP');text=await e.async('string')}else text=await f.text();
   data=JSON.parse(text)}catch(e){setDoc(null);setErrs([`Could not read file: ${e.message}`]);return}
  setZip(z);
  const r=validate(data,{topLevelSubjectsOnly:targetId===null,existingIds:new Set(nodes.map(n=>n.id))});
  setErrs(r.errors);setInfo(r);setDoc(r.errors.length?null:data)};
 const run=async()=>{const sib=nodes.filter(n=>n.parentId===targetId).length;
  const add=flatten(doc.nodes,targetId,sib,uid);let imgs=0,lost=0;
  const files=Object.fromEntries((doc.assets||[]).map(a=>[a.id,a]));
  for(const n of add){if(!n.body)continue;for(const m of new Set(n.body.match(/asset:[a-z0-9]+/g)||[])){const a=files[m.slice(6)],zf=zip&&a&&zip.file(a.file);
   if(!zf){lost++;continue}const blob=new Blob([await zf.async('arraybuffer')],{type:a.type});const nid=uid();
   await putAsset(nid,blob,{noteId:n.id,name:a.name,type:a.type});n.body=n.body.replaceAll(m,'asset:'+nid);imgs++}}
  setNodes([...nodes,...add]);setDoc(null);setDone(`Imported ${add.length} item(s) and ${imgs} image(s) into ${targetTitle}.${lost?` ${lost} image reference(s) had no file and will not display.`:''} Existing content was not changed.`)};
 return <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
  <div className="paper p-4 w-full max-w-xl max-h-[85vh] overflow-auto" onClick={e=>e.stopPropagation()}>
   <h2 className="text-xl font-bold mb-1">Import JSON / ZIP</h2>
   <p className="text-sm text-stone-600 mb-2">Target: <b>{targetTitle}</b> (merge: new items are added; nothing is overwritten). <a className="underline" href="/example-import.json" download>Download example template</a></p>
   <input type="file" accept="application/json,.json,.zip" onChange={e=>pick(e.target.files[0])}/>
   {errs.length>0&&<div className="mt-3 p-2 bg-red-50 border border-red-300 text-sm"><b>{errs.length} problem(s):</b><ul className="list-disc pl-5">{errs.slice(0,30).map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
   {doc&&<div className="mt-3"><b className="text-sm">Preview ({info.count} items)</b>
    {info.conflicts>0&&<p className="text-xs text-amber-700">{info.conflicts} id(s) already exist here; they will be imported as new copies.</p>}
    {!zip&&JSON.stringify(doc).includes('asset:')&&<p className="text-xs text-amber-700">Some notes reference images (asset:…). JSON carries no image files; use the ZIP backup (coming) to keep them.</p>}
    <div className="border p-2 max-h-60 overflow-auto"><Tree list={doc.nodes} budget={{n:300}}/></div>
    <button className="paper px-3 py-1 mt-2" onClick={run}>Import {info.count} items</button></div>}
   {done&&<p className="mt-3 p-2 bg-green-50 border border-green-300 text-sm">{done}</p>}
   <button className="btn mt-3 border" onClick={onClose}>Close</button></div></div>;
}
