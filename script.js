let SECTIONS=[],OFFENSES=[],LEVELS=[];
const KEY="sti-sm-disciplinary-log-v1";
let logs=[],sel=null,selKey=null,lastKey=null,lastSel=null,view="active",recView="active";
const $=id=>document.getElementById(id);
function ask(msg,yes,info){
  $("dlgMsg").textContent=msg;$("dlgNo").style.display=info?"none":"";
  $("dlgYes").textContent=info?"OK":"Yes, remove";$("dlgNo").textContent="No, keep it";$("dlgYes").className=info?"p":"d";
  $("dlg").style.display="flex";
  $("dlgNo").onclick=()=>$("dlg").style.display="none";
  $("dlgYes").onclick=()=>{$("dlg").style.display="none";if(yes)yes()};
}
const notify=m=>ask(m,null,true);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function load(){
  try{logs=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){logs=[]}
  let fixed=false;
  logs.forEach(l=>{const m=/^(.*) \(Level (\d)\)$/.exec(l.offense||"");if(m){l.offense=m[1];l.level=+m[2];fixed=true}});
  if(fixed)save();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(logs));return true}catch(e){notify("Storage is full. Remove or archive older proof images, or use smaller pictures.");return false}}
function fill(el,arr,first){el.innerHTML=(first?`<option value="">${first}</option>`:"")+arr.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join("")}
const LK="sti-sm-lists-v1";
try{const x=JSON.parse(localStorage.getItem(LK)||"null");if(x&&Array.isArray(x.s)&&Array.isArray(x.o)){
  SECTIONS=x.s;OFFENSES=x.o.map(o=>typeof o==="string"?{n:o,lv:1}:o);LEVELS=Array.isArray(x.l)?x.l:[];
  }}catch(e){}
function rank(){OFFENSES.sort((a,b)=>(a.lv||1)-(b.lv||1))}
rank();
function saveLists(){try{localStorage.setItem(LK,JSON.stringify({s:SECTIONS,o:OFFENSES,l:LEVELS}))}catch(e){}}
const DD={};
function syncDD(id){const d=DD[id];if(!d)return;const o=d.sel.options[d.sel.selectedIndex];d.b.textContent=o?o.textContent:"Empty – use Edit list"}
function closeDD(){const p=$("ddp");p.style.display="none";p.dataset.id=""}
function openDD(id){
  const {sel,b}=DD[id],p=$("ddp"),cap=(id==="mngLv"||id.startsWith("lvs"))?140:220;
  if(p.style.display==="block"&&p.dataset.id===id){closeDD();return}
  p.innerHTML="";
  [...sel.options].forEach((o,i)=>{const d=document.createElement("div");d.className="ddi"+(i===sel.selectedIndex?" on":"");d.textContent=o.textContent;
    d.onclick=()=>{sel.selectedIndex=i;syncDD(id);closeDD();sel.dispatchEvent(new Event("input",{bubbles:true}));sel.dispatchEvent(new Event("change",{bubbles:true}))};p.appendChild(d)});
  if(!sel.options.length){const d=document.createElement("div");d.className="ddi";d.textContent="Empty – use Edit list to add items";p.appendChild(d)}
  const r=b.getBoundingClientRect();
  p.style.display="block";p.style.maxHeight=cap+"px";p.style.width=r.width+"px";p.style.left=r.left+"px";
  const need=p.offsetHeight,below=innerHeight-r.bottom-8,up=r.top-8;
  if(need<=below||below>=up){p.style.top=(r.bottom+2)+"px";p.style.bottom="auto";p.style.maxHeight=Math.min(cap,below)+"px"}
  else{p.style.bottom=(innerHeight-r.top+2)+"px";p.style.top="auto";p.style.maxHeight=Math.min(cap,up)+"px"}
  p.dataset.id=id;
  const on=p.querySelector(".on");if(on)on.scrollIntoView({block:"nearest"});
}
function initDD(id){const sel=$(id);sel.classList.add("nat");const w=document.createElement("div");w.className="dd";const b=document.createElement("button");b.type="button";b.className="ddb";w.appendChild(b);sel.after(w);DD[id]={sel,b};b.onclick=e=>{e.stopPropagation();openDD(id)};syncDD(id)}
["fSec","fOff","fltSec","fltOff"].forEach(initDD);
$("ddp").onclick=e=>e.stopPropagation();
document.addEventListener("click",closeDD);addEventListener("resize",closeDD);
document.addEventListener("scroll",e=>{if(!$("ddp").contains(e.target))closeDD()},true);
function fillAll(){
  [["fSec",SECTIONS],["fOff",OFFENSES.map(o=>o.n)],["fltSec",SECTIONS,"All sections"],["fltOff",OFFENSES.map(o=>o.n),"All offenses"]].forEach(([id,arr,first])=>{
    const el=$(id),v=el.value;fill(el,[...new Set(arr.filter(Boolean))],first);
    if([...el.options].some(o=>o.value===v))el.value=v});
  ["fOff","fltOff"].forEach(id=>[...$(id).options].forEach(op=>{if(!op.value)return;const o=OFFENSES.find(x=>x.n===op.value),lv=o?o.lv:(logs.find(x=>x.offense===op.value)||{}).level;if(lv)op.textContent=op.value+" (Level "+lv+")"}));
  ["fSec","fOff","fltSec","fltOff"].forEach(syncDD);
}
let mng=null;
const mngArr=()=>mng==="sec"?SECTIONS:OFFENSES;
function openMng(t){mng=t;$("mngTitle").textContent=t==="sec"?"Edit sections":"Edit offenses";$("mngIn").value="";$("mngLv").value="";editIdx=null;renderMng();$("mng").style.display="flex"}
let editIdx=null;
function renameItem(i){
  const arr=mngArr(),off=mng==="off",nv=$("ein").value.trim();
  if(!nv){notify("The name can’t be empty.");return}
  const old=off?arr[i].n:arr[i];
  if(arr.some((x,j)=>j!==i&&(off?x.n:x).toLowerCase()===nv.toLowerCase())){notify("That name is already in the list.");return}
  if(off)arr[i].n=nv;else arr[i]=nv;
  logs.forEach(l=>{if(off){if(l.offense===old)l.offense=nv}else if(l.section===old)l.section=nv});
  const keep=(off?["fOff","fltOff"]:["fSec","fltSec"]).filter(id=>$(id).value===old);
  editIdx=null;selKey=null;sel=null;saveLists();save();render();
  keep.forEach(id=>{$(id).value=nv;syncDD(id)});
  renderList();renderSide();renderMng();
}
function renderMng(){
  const arr=mngArr(),off=mng==="off";
  if(!DD.mngLv)initDD("mngLv");
  const lvOpts=v=>LEVELS.map(n=>`<option value="${n}" ${n===v?"selected":""}>Level ${n}</option>`).join("");
  $("mngLv").innerHTML=`<option value="">Level…</option>`+lvOpts(+$("mngLv").value||0);
  DD.mngLv.b.parentNode.style.display=off?"":"none";syncDD("mngLv");
  const ms=$("mngList").scrollTop;
  $("mngList").innerHTML=arr.length?arr.map((x,i)=>{const nm=off?x.n:x;
    return `<div class="mi">`+(editIdx===i
      ?`<input class="ein" id="ein" value="${esc(nm)}"><span class="mb"><button data-sv="${i}">Save</button><button data-cx="1">Cancel</button></span>`
      :`<span class="mn">${esc(nm)}</span><span class="mb">${off?`<select class="lvs" data-lv="${i}">${lvOpts(x.lv)}</select>`:""}<button data-ed="${i}">Edit</button><button class="d" data-i="${i}">Remove</button></span>`)+`</div>`}).join(""):`<div class="empty">No items yet. Add one below.</div>`;
  const L=$("mngList");L.scrollTop=ms;
  L.querySelectorAll("select.lvs").forEach((x,i)=>{x.id="lvs"+i;initDD(x.id)});
  L.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
    ask("Remove “"+(off?arr[i].n:arr[i])+"” from the list? Existing records that use it will keep it.",()=>{arr.splice(i,1);editIdx=null;saveLists();fillAll();renderMng()})});
  L.querySelectorAll("[data-lv]").forEach(x=>x.onchange=()=>{arr[+x.dataset.lv].lv=+x.value;rank();saveLists();render();renderMng()});
  L.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>{editIdx=+b.dataset.ed;renderMng();const e=$("ein");if(e){e.focus();e.select()}});
  L.querySelectorAll("[data-cx]").forEach(b=>b.onclick=()=>{editIdx=null;renderMng()});
  L.querySelectorAll("[data-sv]").forEach(b=>b.onclick=()=>renameItem(+b.dataset.sv));
  if($("ein"))$("ein").onkeydown=e=>{if(e.key==="Enter")renameItem(editIdx);if(e.key==="Escape"){editIdx=null;renderMng()}};
  const lb=$("lvBox");lb.style.display=off?"":"none";
  if(off){
    const lk=lb.querySelector(".lvlist"),lks=lk?lk.scrollTop:0;
    lb.innerHTML=`<h2>Levels</h2><div class="lvlist">`+(LEVELS.length?"":`<span class="meta">No levels yet.</span>`)+LEVELS.map(n=>`<span class="lvchip">Level ${n} <button class="mini d" data-rl="${n}" title="Remove level">×</button></span>`).join(" ")+`</div><button class="mini" id="addLv" style="margin:6px 0 0">+ Add level</button>`;
    lb.querySelector(".lvlist").scrollTop=lks;
    lb.querySelectorAll("[data-rl]").forEach(b=>b.onclick=()=>{const n=+b.dataset.rl;
      if(OFFENSES.some(o=>o.lv===n)){notify("Level "+n+" is still used by some offenses. Change those offenses to another level first.");return}
      ask("Remove Level "+n+" from the levels list?",()=>{LEVELS=LEVELS.filter(v=>v!==n);saveLists();render();renderMng()})});
    $("addLv").onclick=()=>{let n=1;while(LEVELS.includes(n))n++;LEVELS.push(n);LEVELS.sort((x,y)=>x-y);saveLists();render();renderMng();const e=$("lvBox").querySelector(`[data-rl="${n}"]`);if(e)e.parentNode.scrollIntoView({block:"nearest"})};
  }
}
function addMng(){
  const v=$("mngIn").value.trim(),arr=mngArr(),off=mng==="off";if(!v)return;
  const lv=+$("mngLv").value;
  if(off&&!LEVELS.length){notify("Please add a level first, using + Add level in this window.");return}
  if(off&&!lv){notify("Please choose a level for this offense.");return}
  if(arr.some(x=>(off?x.n:x).toLowerCase()===v.toLowerCase())){notify("That item is already in the list.");return}
  arr.push(off?{n:v,lv}:v);if(off)rank();editIdx=null;$("mngIn").value="";$("mngLv").value="";saveLists();fillAll();
  const id=off?"fOff":"fSec";$(id).value=v;syncDD(id);renderMng();
}
$("mngAdd").onclick=addMng;$("mngIn").onkeydown=e=>{if(e.key==="Enter")addMng()};
$("mngDone").onclick=()=>$("mng").style.display="none";
document.querySelectorAll("[data-manage]").forEach(b=>b.onclick=()=>openMng(b.dataset.manage));
$("fDate").valueAsDate=new Date();
$("fId").oninput=e=>{e.target.value=e.target.value.replace(/\D/g,"")};
$("fName").oninput=e=>{e.target.value=e.target.value.replace(/[^\p{L}\s.,'’-]/gu,"")};

$("add").onclick=()=>{
  const sid=$("fId").value.trim(),name=$("fName").value.trim();
  if(!sid||!name){notify("Please enter the student ID and name.");return}
  if(!$("fSec").value||!$("fOff").value){notify("Please add at least one section and one offense using Edit list.");return}
  const e={id:Date.now().toString(36),sid,name:(()=>{const m=logs.filter(x=>keyOf(x)===keyOf({sid,name,section:$("fSec").value}));return m.length?m[m.length-1].name:name})(),section:$("fSec").value,offense:$("fOff").value,level:(OFFENSES.find(o=>o.n===$("fOff").value)||{}).lv||1,date:$("fDate").value,notes:$("fNotes").value.trim(),proofs:[]};
  logs.unshift(e);if(!save()){logs.shift();return}
  $("fId").value=$("fName").value=$("fNotes").value="";sel=e.id;selKey=keyOf(e);recView="active";document.querySelectorAll("[data-rv]").forEach(x=>x.classList.toggle("on",x.dataset.rv==="active"));render();
};
["q","fltSec","fltOff"].forEach(i=>$(i).oninput=()=>{renderList();renderSide()});

const keyOf=l=>[l.sid,l.name.trim().replace(/\s+/g," ").toLowerCase(),l.section].join("|");
const lvOf=l=>(OFFENSES.find(o=>o.n===l.offense)||{}).lv||l.level||0;
const baseName=l=>{const m=logs.filter(x=>keyOf(x)===keyOf(l));return m.length?m[m.length-1].name:l.name};
const cntBadge=l=>{const n=logs.filter(x=>keyOf(x)===keyOf(l)).length;return `<span class="cnt ${n>=3?"hi":""}">${n} offense${n>1?"s":""} total</span>`};
const lvc=v=>"lv"+Math.min(v,3);
const lvChips=l=>{const c={};LEVELS.forEach(v=>c[v]=0);logs.filter(x=>keyOf(x)===keyOf(l)).forEach(x=>{const v=lvOf(x);if(v in c)c[v]++});
  const vs=LEVELS.filter(v=>c[v]);
  return `<div class="lvgrid">`+vs.map(v=>`<span class="tag ${lvc(v)} ${c[v]?"":"zero"}">Level ${v}: ${c[v]}</span>`).join("")+`</div>`};
const stuEntries=k=>logs.filter(x=>keyOf(x)===k&&(!!x.archived)===(recView==="archived"));
const shown=k=>stuEntries(k).filter(x=>!$("fltOff").value||x.offense===$("fltOff").value);
function renderList(){
  const q=$("q").value.trim().toLowerCase(),s=$("fltSec").value,o=$("fltOff").value;
  const r=logs.filter(l=>(!q||l.sid.toLowerCase().includes(q)||l.name.toLowerCase().includes(q))&&(!s||l.section===s)&&(!o||l.offense===o)&&(!!l.archived)===(recView==="archived"));
  const ls=$("list").scrollTop;
  const groups=new Map();r.forEach(l=>{const k=keyOf(l);if(!groups.has(k))groups.set(k,l)});
  $("list").innerHTML=groups.size?[...groups.entries()].map(([k,f])=>`<div class="item stu ${k===selKey?"on":""}" data-k="${esc(k)}"><b>${esc(baseName(f))}</b>${cntBadge(f)}<div class="meta">${esc(f.sid)} · ${esc(f.section)}</div><div>${lvChips(f)}</div></div>`).join(""):`<div class="empty">No ${recView} records found.</div>`;
  $("list").scrollTop=ls;
  $("list").querySelectorAll(".stu").forEach(n=>n.onclick=()=>{selKey=n.dataset.k;const e=shown(selKey)[0];sel=e?e.id:null;view="active";render()});
}
function recAction(id,act){
  const l=logs.find(x=>x.id===id);if(!l)return;
  const k=keyOf(l);
  const go=()=>{if(act==="arch")l.archived=!l.archived;else logs=logs.filter(x=>x!==l);
    const rem=stuEntries(k);if(!rem.length){selKey=null;sel=null}else if(sel===id||!rem.some(x=>x.id===sel)){sel=rem[0].id}
    save();render()};
  if(act==="arch")go();else ask("Are you sure you want to remove "+baseName(l)+"’s "+l.offense+" record? Its proof images will be deleted too. If you choose No, it stays in the archive.",go);
}
document.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{recView=b.dataset.rv;sel=null;selKey=null;document.querySelectorAll("[data-rv]").forEach(x=>x.classList.toggle("on",x===b));render()});
function stuAction(act){
  const rows=stuEntries(selKey);if(!rows.length)return;const name=baseName(rows[0]);
  const go=()=>{if(act==="arch")rows.forEach(x=>x.archived=!x.archived);else logs=logs.filter(x=>!rows.includes(x));selKey=null;sel=null;save();render()};
  if(act==="arch")go();else ask("Are you sure you want to remove "+name+"’s record"+(rows.length>1?" ("+rows.length+" reports)":"")+"? Their proof images will be deleted too. If you choose No, it stays in the archive.",go);
}
function renderStats(){$("stA").textContent=logs.filter(l=>!l.archived).length+" active · "+logs.filter(l=>l.archived).length+" archived";$("stB").textContent=new Set(logs.map(keyOf)).size+" students"}

function renderSide(){
  const box=$("side"),pbox=$("pside"),first=selKey?logs.find(x=>keyOf(x)===selKey):null;
  if(!first){selKey=null;sel=null;lastKey=null;lastSel=null;box.innerHTML=`<div class="empty">Select a student to see their offenses.</div>`;pbox.innerHTML=`<div class="empty">Select a student, then an offense, to view or add proof images.</div>`;return}
  const all=logs.filter(x=>keyOf(x)===selKey),br={};all.forEach(x=>br[x.offense]=(br[x.offense]||0)+1);
  const brHtml=Object.entries(br).map(([k,v])=>({k,v,lv:lvOf(all.find(x=>x.offense===k))})).sort((a,b)=>a.lv-b.lv).map(o=>`<span class="tag ${lvc(o.lv)}">${esc(o.k)} ×${o.v}</span>`).join(" ");
  const fo=$("fltOff").value,rows=[...shown(selKey)].sort((a,b)=>lvOf(a)-lvOf(b));let l=rows.find(x=>x.id===sel);if(!l&&rows.length){sel=rows[0].id;l=rows[0]}
  const ps=l?l.proofs.filter(p=>view==="archived"?p.archived:!p.archived):[];
  const sv=q=>{const e=document.querySelector(q);return e?e.scrollTop:0};
  const keepSide=selKey===lastKey?[sv("#side .det"),sv("#side .olist")]:[0,0],keepProof=sel===lastSel?sv("#pside .proofs"):0;
  box.innerHTML=`<div class="det"><b>${esc(baseName(first))}</b><br>${esc(first.sid)} · ${esc(first.section)}<div style="margin-top:6px"><b>Total offenses: ${all.length}</b><div>${lvChips(first)}</div>${brHtml}</div></div>
  <div class="acts" style="margin-top:0"><button id="archStu">${recView==="archived"?"Restore student":"Archive student"}</button>${recView==="archived"?`<button class="d" id="delStu">Remove student</button>`:""}</div>
  <h2 style="margin:0">Offenses (${rows.length} ${recView}${fo?" · "+esc(fo):""})</h2>
  <div class="olist">${rows.length?rows.map(x=>`<div class="item orow ${x.id===sel?"on":""} ${x.archived?"arch":""}" data-id="${x.id}"><span class="tag ${lvc(lvOf(x))}">${esc(x.offense)}${lvOf(x)?" · Level "+lvOf(x):""}</span> <span class="meta">${esc(x.date)} · 📎 ${x.proofs.filter(p=>!p.archived).length}</span>${x.notes?`<div class="meta"><i>${esc(x.notes)}</i></div>`:""}
    <div class="acts"><button data-ra="arch" data-id="${x.id}">${x.archived?"Restore":"Archive"}</button>${x.archived?`<button class="d" data-ra="del" data-id="${x.id}">Remove</button>`:""}</div></div>`).join(""):`<div class="empty">No ${recView} ${fo?esc(fo)+" ":""}offenses.</div>`}</div>`;
  pbox.innerHTML=l?`<div class="meta" style="margin:0">${esc(l.offense)} · ${esc(l.date)}</div>
  <div class="drop" id="drop">＋ Add proof images<br><small>click or drop files here</small></div>
  <input type="file" id="file" accept="image/*" multiple hidden>
  <div class="tabs" style="margin:0"><button data-v="active" class="${view==="active"?"on":""}">Active</button><button data-v="archived" class="${view==="archived"?"on":""}">Archived</button></div>
  <div class="proofs">${ps.length?ps.map(p=>`<div class="pf"><img src="${p.src}" alt="${esc(p.name)}" data-z="${p.id}"><div>
    <button data-a="arch" data-p="${p.id}">${p.archived?"Restore":"Archive"}</button>${p.archived?`<button class="d" data-a="del" data-p="${p.id}">Remove</button>`:""}</div></div>`).join(""):`<div class="empty" style="grid-column:1/-1">No ${view} proofs.</div>`}</div>`:`<div class="empty">Click an offense to view or add proof images.</div>`;
  const put=(q,v)=>{const e=document.querySelector(q);if(e)e.scrollTop=v};
  put("#side .det",keepSide[0]);put("#side .olist",keepSide[1]);put("#pside .proofs",keepProof);lastKey=selKey;lastSel=sel;
  $("archStu").onclick=()=>stuAction("arch");if($("delStu"))$("delStu").onclick=()=>stuAction("del");
  box.querySelectorAll(".orow").forEach(n=>n.onclick=()=>{sel=n.dataset.id;view="active";renderSide()});
  box.querySelectorAll("[data-ra]").forEach(b=>b.onclick=e=>{e.stopPropagation();recAction(b.dataset.id,b.dataset.ra)});
  if(l){
    const f=$("file"),d=$("drop");
    d.onclick=()=>f.click();f.onchange=()=>addFiles(f.files);
    d.ondragover=e=>{e.preventDefault();d.classList.add("over")};d.ondragleave=()=>d.classList.remove("over");
    d.ondrop=e=>{e.preventDefault();d.classList.remove("over");addFiles(e.dataTransfer.files)};
    pbox.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{view=b.dataset.v;renderSide()});
    pbox.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{
      const p=l.proofs.find(x=>x.id===b.dataset.p);
      if(b.dataset.a==="arch"){p.archived=!p.archived;save();render()}
      else ask("Are you sure you want to remove this image? If you choose No, it stays in the archive.",()=>{l.proofs=l.proofs.filter(x=>x!==p);save();render()});
    });
    pbox.querySelectorAll("[data-z]").forEach(i=>i.onclick=()=>{$("lb").querySelector("img").src=i.src;$("lb").style.display="flex"});
  }
}
function shrink(file){return new Promise(res=>{
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const m=900,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");
    c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.7))};
    im.onerror=()=>res(null);im.src=r.result};r.onerror=()=>res(null);r.readAsDataURL(file)})}
async function addFiles(files){
  const l=logs.find(x=>x.id===sel);if(!l)return;
  for(const f of files){if(!f.type.startsWith("image/"))continue;
    const src=await shrink(f);if(!src)continue;
    l.proofs.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:f.name,src,archived:false,ts:Date.now()});
    if(!save()){l.proofs.pop();break}}
  view="active";render();
}
$("lb").onclick=()=>$("lb").style.display="none";
function render(){fillAll();renderStats();renderList();renderSide()}
load();render();
