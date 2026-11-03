'use client';
import {useEffect,useRef,useState} from 'react';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {uid,putAsset,getAsset} from '../lib/db';

const Img=Image.extend({addAttributes(){return{...this.parent?.(),
 width:{default:null,parseHTML:e=>e.getAttribute('data-w'),renderHTML:a=>a.width?{'data-w':a.width,style:`width:${a.width}%`}:{}},
 align:{default:'left',parseHTML:e=>e.getAttribute('data-align')||'left',renderHTML:a=>({'data-align':a.align})}}}});

// Saved HTML references images as asset:<id>; blob URLs are only used while the page is open.
export default function Editor(props){
 const [html,setHtml]=useState(null);const map=useRef({});
 useEffect(()=>{let ok=true;(async()=>{let h=props.value||'';
  for(const id of new Set(h.match(/asset:[a-z0-9]+/g)||[])){const a=await getAsset(id.slice(6));
   if(a){const u=URL.createObjectURL(a.blob);map.current[u]=id.slice(6);h=h.replaceAll(id,u)}}
  if(ok)setHtml(h)})();return()=>{ok=false}},[]);
 return html===null?null:<Inner {...props} html={html} map={map}/>;
}

function Inner({html,map,noteId,onSave,modified}){
 const [status,setStatus]=useState('Saved');const t=useRef();const edRef=useRef();const file=useRef();
 const ser=()=>{let h=edRef.current.getHTML();for(const[u,id] of Object.entries(map.current))h=h.replaceAll(u,'asset:'+id);return h};
 const addImg=async(f)=>{const id=uid();await putAsset(id,f,{noteId,name:f.name,type:f.type});
  const u=URL.createObjectURL(f);map.current[u]=id;edRef.current.chain().focus().setImage({src:u,alt:f.name}).run()};
 const imgs=(list)=>[...(list||[])].filter(x=>x.type.startsWith('image/'));
 const ed=useEditor({immediatelyRender:false,content:html,
  extensions:[StarterKit,Underline,Link.configure({openOnClick:false}),Img,TaskList,TaskItem.configure({nested:true}),Table.configure({resizable:true}),TableRow,TableHeader,TableCell],
  editorProps:{attributes:{class:'tt min-h-[300px] p-4 outline-none'},
   handlePaste:(v,e)=>{const f=imgs(e.clipboardData?.files);if(!f.length)return false;f.forEach(addImg);return true},
   handleDrop:(v,e)=>{const f=imgs(e.dataTransfer?.files);if(!f.length)return false;e.preventDefault();f.forEach(addImg);return true}},
  onUpdate:()=>{setStatus('Unsaved…');clearTimeout(t.current);t.current=setTimeout(()=>{onSave(ser());setStatus('Saved')},800)}});
 useEffect(()=>{edRef.current=ed},[ed]);
 useEffect(()=>()=>clearTimeout(t.current),[]);
 if(!ed)return null;
 const c=()=>ed.chain().focus();
 const B=(l,f,a)=><button key={l} className={`btn text-sm ${a?'bg-amber-200':''}`} onClick={f}>{l}</button>;
 const link=()=>{const u=prompt('URL (empty to remove)',ed.getAttributes('link').href||'');u?c().setLink({href:u}).run():c().unsetLink().run()};
 const size=()=>{const w=prompt('Image width % (10-100)',ed.getAttributes('image').width||'100');if(w)c().updateAttributes('image',{width:Math.min(100,Math.max(10,+w||100))}).run()};
 const align=()=>{const n={left:'center',center:'right',right:'left'}[ed.getAttributes('image').align||'left'];c().updateAttributes('image',{align:n}).run()};
 const save=()=>{clearTimeout(t.current);onSave(ser());setStatus('Saved')};
 const img=ed.isActive('image');
 return <div className="paper mt-2">
  <div className="flex flex-wrap gap-1 p-2 border-b border-amber-900/20 items-center">
   {B('B',()=>c().toggleBold().run(),ed.isActive('bold'))}{B('I',()=>c().toggleItalic().run(),ed.isActive('italic'))}
   {B('U',()=>c().toggleUnderline().run(),ed.isActive('underline'))}{B('S',()=>c().toggleStrike().run(),ed.isActive('strike'))}
   {B('H1',()=>c().toggleHeading({level:1}).run(),ed.isActive('heading',{level:1}))}{B('H2',()=>c().toggleHeading({level:2}).run(),ed.isActive('heading',{level:2}))}
   {B('• List',()=>c().toggleBulletList().run(),ed.isActive('bulletList'))}{B('1. List',()=>c().toggleOrderedList().run(),ed.isActive('orderedList'))}
   {B('☑ Tasks',()=>c().toggleTaskList().run(),ed.isActive('taskList'))}{B('Quote',()=>c().toggleBlockquote().run(),ed.isActive('blockquote'))}
   {B('Code',()=>c().toggleCode().run(),ed.isActive('code'))}{B('{ }',()=>c().toggleCodeBlock().run(),ed.isActive('codeBlock'))}
   {B('Link',link,ed.isActive('link'))}{B('Divider',()=>c().setHorizontalRule().run())}
   {B('Table',()=>c().insertTable({rows:3,cols:3,withHeaderRow:true}).run())}
   {B('Image',()=>file.current.click())}{img&&B('Size',size)}{img&&B('Align',align)}
   <input ref={file} type="file" accept="image/*" hidden multiple onChange={e=>{imgs(e.target.files).forEach(addImg);e.target.value=''}}/>
   <span className="ml-auto text-xs text-stone-500">{status}{modified&&` · modified ${new Date(modified).toLocaleString()}`}</span>
   <button className="btn text-sm border" onClick={save}>Save</button></div>
  <EditorContent editor={ed}/></div>;
}
