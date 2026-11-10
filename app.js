/* TaskMate • app.js — HTML/PWA + Supabase v2 + demo mode */
(() => {
'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'id'+Math.random().toString(36).slice(2)+Date.now());
const date = v => v ? new Date(v) : null;
const nice = v => v ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(date(v)) : 'Tanpa deadline';
const niceTime = v => v ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date(v)) : 'Tidak ditentukan';
const dayLabel = () => new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
const getIso = (days=0,h=18,m=0) => { const d=new Date(); d.setDate(d.getDate()+days);d.setHours(h,m,0,0);return d.toISOString(); };
const dateLocal = v => {if(!v)return '';const d=date(v),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const state={mode:'demo',db:null,user:{id:'demo-me',email:'demo@taskmate.local'},workspace:null,workspaces:[],joinRequests:[],members:[],profiles:[],tasks:[],checks:[],evidence:[],tab:(new URLSearchParams(location.search).get('tab')==='shift'?'shift':'home'),shiftDate:localDay(),shiftNumber:[1,2,3].includes(Number(new URLSearchParams(location.search).get('shift')))?Number(new URLSearchParams(location.search).get('shift')):1,shiftFilter:'all',shiftView:'mine',assignmentPanelsOpen:{},shiftRoster:[],shiftLogs:[],shiftAdmins:[],shiftPics:[],shiftTaskVersions:[],shiftTaskConfigError:'',showTaskManager:false,shiftProofs:[],rackAssignments:[],rackChecks:[],rackPhotos:[],mapPhotos:[],shiftReady:false,shiftError:'',rackError:'',staffLinks:[],staffLinkError:'',filter:'all',priority:'all',search:'',reportRange:'week',photoReportDate:localDay(),photoReportShift:'all',photoReportPic:'all',photoReportItems:[],photoReportLoaded:false,photoReportBusy:false,photoReportError:'',photoReportWorkspaceId:null,modal:null,lastSync:null,realtime:null,reloading:false,reloadQueued:false,busy:false,authTab:'login',notice:''};
let toastTimer, reloadTimer;
const signedThumbs = new Map();
const tmInnerScrollMemory=new Map();
const priorityNames={high:'Tinggi',normal:'Sedang',low:'Rendah'}, statusNames={todo:'Belum mulai',doing:'Dikerjakan',done:'Selesai'};
const icons={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.5V20h13V9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 shift:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 tasks:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 4.5h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 reports:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19V10M12 19V5M18 19v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 20.5h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 team:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 18c.9-2.6 3-4 5.7-4 2.8 0 4.9 1.4 5.8 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14.5 17c.55-1.58 1.8-2.53 3.65-2.92" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l1.2 2.1 2.4.5-.4 2.4 1.7 1.7-1.7 1.7.4 2.4-2.4.5L12 20.5l-1.2-2.1-2.4-.5.4-2.4-1.7-1.7 1.7-1.7-.4-2.4 2.4-.5L12 3.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.9" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>'
};

function tmPocketGlyph(kind){
 const a={
  broom:`<path d="M10 5l5 11" stroke="#463328" stroke-width="3" stroke-linecap="round"/><path d="M14 14l8-2 5 12-8 2-5-12z" fill="#f3b457" stroke="#463328" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 17l7-2M18 21l7-2" stroke="#463328" stroke-width="1.6" stroke-linecap="round"/><path d="M8 4l2-2M5 9l-3-1" stroke="#f1866d" stroke-width="2.5" stroke-linecap="round"/>`,
  cart:`<path d="M4 8h4l3 12h16l4-11H10" fill="#fbe2a0" stroke="#34302b" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 12h14M16 16h10" stroke="#ae8970" stroke-width="2"/><circle cx="14" cy="24" r="2.8" fill="#f67e9f" stroke="#34302b" stroke-width="2"/><circle cx="26" cy="24" r="2.8" fill="#81d9be" stroke="#34302b" stroke-width="2"/><path d="M15 3l3-2M24 3l1-2" stroke="#eac158" stroke-width="2"/>`,
  moon:`<path d="M24 5a12 12 0 1 0 5 21A13 13 0 0 1 24 5z" fill="#b6a9ef" stroke="#35303b" stroke-width="2.7" stroke-linejoin="round"/><path d="M9 3l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill="#f8c46f" stroke="#35303b" stroke-width="1.5"/><path d="M29 10l.6 2.5 2.6.6-2.6.6-.6 2.5-.6-2.5-2.6-.6 2.6-.6z" fill="#fff2ad"/>`,
  camera:`<rect x="3" y="9" width="30" height="20" rx="5" fill="#b8e6ef" stroke="#35303b" stroke-width="2.8"/><path d="M11 9l2-5h9l2 5" fill="#ffc18a" stroke="#35303b" stroke-width="2.8" stroke-linejoin="round"/><circle cx="18" cy="19" r="6" fill="#8dc5f3" stroke="#35303b" stroke-width="2.5"/><circle cx="18" cy="19" r="2.7" fill="#fff0c3"/><circle cx="29" cy="13" r="1.7" fill="#f7799e"/>`,
  home:`<path d="M4 16l14-12 14 12v15H4z" fill="#f7d58d" stroke="#35303b" stroke-width="2.8" stroke-linejoin="round"/><rect x="15" y="20" width="7" height="11" rx="1.5" fill="#90dcca" stroke="#35303b" stroke-width="2"/><path d="M1 16L18 2l17 14" stroke="#35303b" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  shift:`<circle cx="18" cy="18" r="14" fill="#f6d5a0" stroke="#35303b" stroke-width="2.8"/><path d="M18 9v9l7 4" stroke="#35303b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 2h14" stroke="#35303b" stroke-width="3" stroke-linecap="round"/>`,
  tasks:`<rect x="7" y="4" width="23" height="29" rx="4" fill="#a5e3c5" stroke="#35303b" stroke-width="2.8"/><path d="M12 12l2 2 4-5M20 13h6M12 22l2 2 4-5M20 23h6" stroke="#35303b" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
  reports:`<rect x="4" y="4" width="28" height="29" rx="4" fill="#e8c1f7" stroke="#35303b" stroke-width="2.8"/><path d="M10 26v-8M18 26V10M26 26v-12" stroke="#35303b" stroke-width="3.5" stroke-linecap="round"/><path d="M9 28h18" stroke="#35303b" stroke-width="2"/>`,
  team:`<circle cx="12" cy="12" r="5.5" fill="#f8bdc8" stroke="#35303b" stroke-width="2.7"/><circle cx="26" cy="13" r="4.5" fill="#f5d59c" stroke="#35303b" stroke-width="2.5"/><path d="M3 30c0-8 4-11 10-11s10 3 10 11M23 23c7-4 11-1 11 7" fill="#f7bdc8" stroke="#35303b" stroke-width="2.7" stroke-linejoin="round"/>`,
  settings:`<circle cx="18" cy="18" r="14" fill="#a8d9ef" stroke="#35303b" stroke-width="2.6"/><path d="M18 5v5M18 26v5M5 18h5M26 18h5M9 9l3 3M24 24l3 3M9 27l3-3M24 12l3-3" stroke="#35303b" stroke-width="2.7" stroke-linecap="round"/><circle cx="18" cy="18" r="5" fill="#ffcb92" stroke="#35303b" stroke-width="2.5"/>`
 };
 return `<svg class="tm-pocket-illustration" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${a[kind]||a.tasks}</svg>`;
}
const tabs=[['home','Dashboard'],['shift','Checklist Shift'],['tasks','Tugas'],['reports','Laporan'],['team','Tim'],['settings','Pengaturan']];

// v13: hanya preferensi tampilan lokal berdasarkan akun login di perangkat ini.
// Tidak disimpan ke Supabase dan tidak pernah ikut dalam data tim.
const PERSONAL_THEMES=[
 {id:'pocket',name:'Pocket Wallet',subtitle:'Kartu dompet kompak · ilustrasi kiri · isi pastel',bg:'#302e2d',card:'#4a4441',accent:'#ffd39b',dark:true},
 {id:'pop',name:'Pop Folder',subtitle:'Kartu folder · garis hitam · kuning cerah',bg:'#fff8e6',card:'#fffdf9',accent:'#ffcf23',dark:false},
 {id:'classic',name:'TaskMate Original',subtitle:'Tampilan awal yang familiar',bg:'#f5f7fb',card:'#ffffff',accent:'#356ef4',dark:false},
 {id:'wallet',name:'Midnight Wallet',subtitle:'Gelap · gradasi ungu & neon',bg:'#151629',card:'#282941',accent:'#a780ff',dark:true},
 {id:'trantor',name:'Trantor Mint',subtitle:'Putih · hitam · mint segar',bg:'#f0f4f2',card:'#ffffff',accent:'#22beb2',dark:false},
 {id:'social',name:'Social Coral',subtitle:'Navy · putih · coral',bg:'#f5f5fc',card:'#ffffff',accent:'#fb6987',dark:false},
 {id:'moonie',name:'Moonie Aurora',subtitle:'Malam ungu · cahaya magenta',bg:'#171b4f',card:'#2b3069',accent:'#e292fa',dark:true},
 {id:'arena',name:'Arena Neon',subtitle:'Esports · elektrik biru & cyan',bg:'#07182c',card:'#0f3049',accent:'#2cdcf1',dark:true},
 {id:'gamer',name:'Gamer Pop',subtitle:'Putih · biru · warna ceria',bg:'#f3f7ff',card:'#ffffff',accent:'#6677ff',dark:false},
 {id:'melody',name:'Melody Studio',subtitle:'Putih · garis hitam · peach',bg:'#f7f8f6',card:'#ffffff',accent:'#f4b35e',dark:false},
 {id:'ink',name:'Ink Cat',subtitle:'Monokrom · aprikot lembut',bg:'#f6f5f3',card:'#ffffff',accent:'#ffa878',dark:false},
 {id:'learn',name:'Learn Minimal',subtitle:'Editorial · hitam & putih',bg:'#efefef',card:'#ffffff',accent:'#141414',dark:false},
 {id:'navy',name:'Task Navy',subtitle:'Timeline gelap · lime & cyan',bg:'#13233e',card:'#223756',accent:'#c6eaa1',dark:true}
];
function personalThemeKey(){return 'taskmate-personal-theme-v1:'+String(state.user?.id||'guest')}
function personalTheme(){
 try{const saved=localStorage.getItem(personalThemeKey());return PERSONAL_THEMES.some(x=>x.id===saved)?saved:'classic'}
 catch{return 'classic'}
}
function personalShapeKey(){return 'taskmate-personal-shape-v1:'+String(state.user?.id||'guest')}
function personalShape(){
 try{const choice=localStorage.getItem(personalShapeKey());if(choice==='neo'||choice==='soft')return choice}catch{}
 return personalTheme()==='classic'||personalTheme()==='pocket'?'soft':'neo';
}
function applyPersonalTheme(){
 const id=personalTheme(),theme=PERSONAL_THEMES.find(x=>x.id===id)||PERSONAL_THEMES[0];
 document.documentElement.dataset.tmTheme=id;
 document.documentElement.dataset.tmShape=personalShape();
 const meta=document.querySelector('meta[name="theme-color"]');const barColor=theme.dark?theme.bg:'#1f2430';if(meta)meta.setAttribute('content',barColor);document.documentElement.style.setProperty('--tm-statusbar-runtime',barColor);
}
function personalThemePicker(){
 const selected=personalTheme();
 return `<section class="panel tm-theme-settings" aria-labelledby="tm-theme-heading">
  <div class="tm-theme-header"><div><span class="tm-theme-kicker">PERSONALISASI TAMPILAN</span><h2 id="tm-theme-heading">Tema aplikasi</h2>
  <p>Pilih gaya yang paling nyaman. Pilihan ini hanya berlaku untuk akun ini di HP ini.</p></div><span class="tm-theme-local-pill">🔒 Lokal</span></div>
  <div class="tm-theme-grid">${PERSONAL_THEMES.map(t=>`<button type="button" data-action="personal-theme" data-theme="${t.id}" class="tm-theme-option ${t.id===selected?'selected':''}" aria-pressed="${t.id===selected}" title="Pilih ${t.name}">
   <span class="tm-theme-preview" style="--preview-bg:${t.bg};--preview-card:${t.card};--preview-accent:${t.accent};--preview-ink:${t.dark?'#f5f6ff':'#23324b'}">
    <span class="tm-preview-status"><i></i><i></i><i></i></span>
    <span class="tm-preview-banner"><b></b><b></b></span>
    <span class="tm-preview-row"><i></i><i></i></span>
    <span class="tm-preview-row short"><i></i><i></i></span>
    <span class="tm-preview-foot"><i></i><i></i><i></i></span>
   </span><span class="tm-theme-option-title">${t.name}<span aria-hidden="true">${t.id===selected?'✓':''}</span></span>
   <span class="tm-theme-option-desc">${t.subtitle}</span>
  </button>`).join('')}</div>
  <div class="tm-shape-picker" aria-label="Bentuk kartu aplikasi">
   <div class="tm-shape-heading"><strong>Bentuk kartu</strong><span>Pilih bentuk bebas dari warna tema</span></div>
   <div class="tm-shape-buttons">
    <button type="button" class="tm-shape-option ${personalShape()==='neo'?'selected':''}" data-action="personal-shape" data-shape="neo" aria-pressed="${personalShape()==='neo'}"><span class="tm-shape-symbol">▣</span><span><b>Folder 3D</b><small>Tebal, tab warna & bayangan tegas</small></span></button>
    <button type="button" class="tm-shape-option ${personalShape()==='soft'?'selected':''}" data-action="personal-shape" data-shape="soft" aria-pressed="${personalShape()==='soft'}"><span class="tm-shape-symbol">◫</span><span><b>Kartu halus</b><small>Minimalis seperti sebelumnya</small></span></button>
   </div>
  </div>
  <div class="tm-theme-privacy">✓ Tidak mengubah akun lain &nbsp;·&nbsp; ✓ Tidak mengubah data pekerjaan &nbsp;·&nbsp; ✓ Tidak perlu Supabase</div>
 </section>`;
}

function notify(msg,isError=false){const t=$('#toast');if(!t)return;t.textContent=msg;t.className='show'+(isError?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className='',3400)}
function errMessage(error){return error?.message || String(error || 'Terjadi kesalahan.');}
function showError(error){console.error('[TaskMate]',error);notify(errMessage(error),true)}
function currentUserName(){return getProfile(state.user?.id)?.full_name || (state.user?.user_metadata?.full_name) || 'Pengguna'}
function getProfile(id){return state.profiles.find(p=>p.id===id)}
function memberName(id){return id ? (getProfile(id)?.full_name || 'Anggota') : 'Belum ditugaskan'}
function initials(s){return String(s||'?').split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()}
function taskChecks(tid){return state.checks.filter(c=>c.task_id===tid).sort((a,b)=>a.position-b.position)}
function taskProofs(tid){return state.evidence.filter(x=>x.task_id===tid)}
function progress(t){const a=taskChecks(t.id);return a.length?Math.round(a.filter(x=>x.is_checked).length/a.length*100):(t.status==='done'?100:0)}
function overdue(t){return t.status!=='done' && !!t.due_at && new Date(t.due_at).getTime()<Date.now()}
function dueToday(t){if(!t.due_at)return false;return new Date(t.due_at).toDateString()===new Date().toDateString()}
function dueSoon(t){return t.status!=='done' && !!t.due_at && new Date(t.due_at).getTime()<=Date.now()+24*3600e3 && new Date(t.due_at).getTime()>Date.now()}
function isAdmin(){return state.mode==='demo' || !!state.members.find(m=>m.user_id===state.user?.id && m.role==='admin' && m.status==='approved')}
function canDelete(t){return state.mode==='demo'||t.created_by===state.user.id||isAdmin()}
function setDemo(){
 const cached=localStorage.getItem('taskmate-demo-v1');let data;
 if(cached){try{data=JSON.parse(cached)}catch{}}
 if(!data){
  const workspace={id:'demo-team',name:'Tim Operasional',invite_code:'DEMO1234',created_by:'demo-me'};
  const profiles=[{id:'demo-me',full_name:'Anda (Admin)'},{id:'demo-dina',full_name:'Dina Putri'},{id:'demo-rizky',full_name:'Rizky Pratama'}];
  const members=profiles.map((p,i)=>({workspace_id:workspace.id,user_id:p.id,role:i===0?'admin':'member'}));
  const mk=(id,title,assignee_id,delta,status,priority='normal',description='',required=false)=>({id,workspace_id:workspace.id,title,assignee_id,due_at:getIso(delta),status,priority,category:'Operasional',description,evidence_required:required,created_by:'demo-me',created_at:getIso(-2),updated_at:getIso(-1),completed_at:status==='done'?getIso(-1):null});
  const tasks=[mk('task-a','Pemeriksaan kondisi area kerja','demo-me',0,'doing','high','Periksa kebersihan area dan lampirkan foto hasil pemeriksaan.',true),mk('task-b','Kirim laporan shift harian','demo-dina',0,'todo','normal','Rekap aktivitas shift dan pastikan seluruh kolom report terisi.'),mk('task-c','Cek inventaris dan stok barang','demo-rizky',1,'todo','low','Hitung stok barang dan cocokkan dengan data inventaris.'),mk('task-d','Serahkan rekap pekerjaan mingguan','demo-me',-1,'done','normal','Laporan telah dikirim kepada supervisor.')];
  const checks=[{id:'check-a1',task_id:'task-a',title:'Pemeriksaan area depan',position:1,is_checked:true,checked_by:'demo-me',checked_at:getIso(0)},{id:'check-a2',task_id:'task-a',title:'Pemeriksaan area belakang',position:2,is_checked:false},{id:'check-a3',task_id:'task-a',title:'Upload foto dokumentasi',position:3,is_checked:false},{id:'check-b1',task_id:'task-b',title:'Isi form report',position:1,is_checked:false},{id:'check-b2',task_id:'task-b',title:'Konfirmasi ke atasan',position:2,is_checked:false},{id:'check-d1',task_id:'task-d',title:'Kirim laporan',position:1,is_checked:true}];
  data={workspace,profiles,members,tasks,checks,evidence:[]};
 }
 state.workspace=data.workspace;state.workspaces=[data.workspace];state.profiles=data.profiles;state.members=data.members.map(m=>({...m,status:m.status||'approved'}));state.tasks=data.tasks;state.checks=data.checks;state.evidence=data.evidence;loadShiftDemo();seedDemoNovember();state.lastSync=new Date().toISOString();
}
function persistDemo(){if(state.mode!=='demo')return;try{localStorage.setItem('taskmate-demo-v1',JSON.stringify({workspace:state.workspace,profiles:state.profiles,members:state.members,tasks:state.tasks,checks:state.checks,evidence:state.evidence}));persistShiftDemo();}catch(e){showError('Penyimpanan demo penuh. Kurangi jumlah file bukti.')}}
const config=()=>{
 const saved=JSON.parse(localStorage.getItem('taskmate-cloud-config')||'null')||{};
 const file=window.TASKMATE_CONFIG||{};
 return {url:(file.supabaseUrl||saved.url||'').trim(),key:(file.supabaseAnonKey||saved.key||'').trim()};
};
async function start(){
 const c=config();
 if(c.url&&c.key){
  if(!window.supabase){document.querySelector('#app').innerHTML='<div class="boot"><h2>Koneksi diperlukan</h2><p>Supabase belum termuat. Periksa internet, lalu muat ulang.</p></div>';return;}
  try{state.db=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});state.mode='cloud';const {data,error}=await state.db.auth.getSession();if(error)throw error;state.user=data.session?.user||null;
   state.db.auth.onAuthStateChange((event,session)=>{if(event==='INITIAL_SESSION')return;state.user=session?.user||null;if(event==='SIGNED_IN'||event==='SIGNED_OUT'){state.shiftView='mine';setTimeout(()=>loadAll().catch(showError),0)}});
   if(state.user)await loadAll();else render();
  }catch(e){document.querySelector('#app').innerHTML='<div class="boot"><h2>Supabase gagal terhubung</h2><p>Periksa internet dan konfigurasi aplikasi.</p></div>';console.error(e);return;}
 }else{state.mode='demo';setDemo();render()}
 if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
 setInterval(checkReminders,60000);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  checkReminders();
  if(state.mode==='cloud'&&state.user&&navigator.onLine&&(!state.lastSync||Date.now()-new Date(state.lastSync).getTime()>60000))syncNow();
 });
 window.addEventListener('online',()=>{if(state.mode==='cloud'&&state.user)syncNow()});
}
async function loadAll(){
 if(state.mode!=='cloud'){setDemo();render();return}
 if(!state.user){state.photoReportItems=[];state.photoReportLoaded=false;state.photoReportWorkspaceId=null;state.workspaces=[];state.joinRequests=[];state.workspace=null;state.tasks=[];state.shiftLogs=[];state.shiftRoster=[];state.shiftTaskVersions=[];state.shiftAdmins=[];state.shiftPics=[];state.shiftProofs=[];state.rackAssignments=[];state.rackChecks=[];state.rackPhotos=[];state.mapPhotos=[];state.staffLinks=[];unsubscribe();render();return}
 const [{data:list,error},{data:requests,error:requestError}]=await Promise.all([
  state.db.from('workspace_members').select('workspace_id,role,status,workspaces(id,name,invite_code,created_by)').eq('user_id',state.user.id),
  state.db.rpc('get_my_workspace_requests')
 ]);
 if(error)throw error;if(requestError)throw requestError;
 state.joinRequests=requests||[];
 state.workspaces=(list||[]).filter(x=>x.status==='approved').map(x=>x.workspaces).filter(Boolean);
 const preferred=localStorage.getItem('taskmate-current-workspace');
 state.workspace=state.workspaces.find(x=>x.id===preferred)||state.workspaces[0]||null;
 if(state.photoReportWorkspaceId!==state.workspace?.id){state.photoReportItems=[];state.photoReportLoaded=false;state.photoReportWorkspaceId=state.workspace?.id||null;}
 if(!state.workspace){state.members=[];state.tasks=[];state.checks=[];state.evidence=[];state.shiftLogs=[];state.shiftRoster=[];state.shiftTaskVersions=[];state.shiftAdmins=[];state.shiftPics=[];state.shiftProofs=[];state.rackAssignments=[];state.rackChecks=[];state.rackPhotos=[];state.mapPhotos=[];unsubscribe();render();return}
 await refreshCloud(true);
}
async function refreshCloud(resubscribe=false){
 if(state.mode!=='cloud'||!state.user||!state.workspace)return;
 const wid=state.workspace.id, db=state.db;
 const [m,t]=await Promise.all([
  db.from('workspace_members').select('workspace_id,user_id,role,status,joined_at').eq('workspace_id',wid),
  db.from('tasks').select('*').eq('workspace_id',wid).order('created_at',{ascending:false})
 ]);
 if(m.error)throw m.error;if(t.error)throw t.error;
 if(!(m.data||[]).some(x=>x.user_id===state.user.id&&x.status==='approved')){
  await loadAll();return;
 }
 if(state.workspace?.id!==wid)return;
 const members=m.data||[],tasks=t.data||[],ids=tasks.map(x=>x.id);
 const requests=[db.from('profiles').select('id,full_name').in('id',members.length?members.map(x=>x.user_id):[state.user.id])];
 if(ids.length){requests.push(db.from('task_checklists').select('*').in('task_id',ids));requests.push(db.from('task_evidence').select('*').in('task_id',ids))}
 const r=await Promise.all(requests);for(const v of r){if(v.error)throw v.error}
 if(state.workspace?.id!==wid)return;
 state.members=members;state.tasks=tasks;state.profiles=r[0].data||[];state.checks=ids.length?(r[1].data||[]):[];state.evidence=ids.length?(r[2].data||[]):[];state.lastSync=new Date().toISOString();
 if(resubscribe)subscribe(wid);
 await loadShiftCloud();render();checkReminders();
}
function unsubscribe(){if(state.realtime&&state.db)state.db.removeChannel(state.realtime);state.realtime=null}
function subscribe(wid){
 unsubscribe();if(state.mode!=='cloud')return;
 const chan=state.db.channel('taskmate-'+wid)
 .on('postgres_changes',{event:'*',schema:'public',table:'tasks',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'task_checklists'},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'task_evidence'},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'workspace_members',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_roster',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_task_versions',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_shift_admins',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_task_pics',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_logs',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_evidence'},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_rack_assignments',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_rack_checks',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_staff_links',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_staff_seed',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_rack_photos',filter:`workspace_id=eq.${wid}`},requestReload)
 .on('postgres_changes',{event:'*',schema:'public',table:'shift_map_photos',filter:`workspace_id=eq.${wid}`},requestReload)
 .subscribe();state.realtime=chan;
}
function requestReload(){clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>{if(state.mode==='cloud'&&state.user)refreshCloud().catch(showError)},450)}
async function syncNow(){
 if(state.reloading)return;
 state.reloading=true;
 try{
  if(state.mode==='cloud'){
   if(!navigator.onLine)throw new Error('HP sedang offline. Sambungkan internet lalu coba sinkron ulang.');
   await loadAll();
  }else {persistDemo();render()}
  notify('✓ Data HP sudah diperbarui dari Cloud · '+new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date()));
 }catch(e){showError(e)}finally{state.reloading=false}
}
function shell(inner){
 const headline={home:'Dashboard',shift:'Checklist Shift 1–3',tasks:'Daftar Tugas',reports:'Laporan Pekerjaan',team:'Tim & Anggota',settings:'Pengaturan'}[state.tab];
 return `<div class="app-shell"><aside class="sidebar"><div class="logo"><mark>✓</mark> TaskMate</div><div class="nav-caption">MENU UTAMA</div>${tabs.map(([id,t])=>`<button class="side-item ${state.tab===id?'active':''}" data-action="tab" data-tab="${id}"><span class="ico">${icons[id]}</span>${t}</button>`).join('')}<div class="sidebar-bottom"><h4>✨ Satu tim, satu progres.</h4><p>Atur tugas, pantau laporan, dan simpan bukti pekerjaan dalam satu tempat.</p></div></aside><main class="main"><header class="topbar"><div class="top-left"><div class="eyebrow">${state.workspace?esc(state.workspace.name):'TaskMate'} / ${dayLabel()}</div><h1>${headline}</h1></div><div class="top-actions"><button type="button" class="tm-cloud-sync" data-action="sync" aria-label="Sinkron ulang data dari cloud" title="Sinkronkan sekarang dari Supabase"><span class="tm-sync-icon" aria-hidden="true">↻</span><span class="tm-sync-word">Sinkron</span></button><span class="chip ${state.mode==='demo'?'demo':''}"><i class="dot"></i>${state.mode==='demo'?'Mode demo':'Tersambung'}</span><div class="avatar" title="${esc(currentUserName())}">${esc(initials(currentUserName()))}</div></div></header>${state.mode==='demo'?`<div class="notice info"><span>ⓘ</span><span><b>Mode demo.</b> Data hanya tersimpan di HP ini. <button class="link-button" data-action="open-config">Hubungkan Supabase</button> untuk sinkron antar-HP.</span></div>`:''}${state.notice?`<div class="notice">${esc(state.notice)}</div>`:''}${inner}</main>${state.tab==='shift'?'':'<button class="floating" aria-label="Tambah tugas" data-action="new-task">+</button>'}<nav class="bottom-nav">${tabs.map(([id,t])=>`<button class="${state.tab===id?'active':''}" data-action="tab" data-tab="${id}"><span class="ico">${icons[id]}<span class="tm-pocket-nav-art">${tmPocketGlyph(id)}</span></span><span>${t==='Pengaturan'?'Setelan':t==='Checklist Shift'?'Shift':t}</span></button>`).join('')}</nav></div>`;
}
function metric(label,value,icon,color,foot){return `<div class="metric"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon ${color}">${icon}</span></div><strong>${value}</strong><div class="metric-foot">${foot}</div></div>`}
function taskCard(t){
 const p=progress(t),n=memberName(t.assignee_id),c=taskChecks(t.id),e=taskProofs(t.id);
 return `<div class="task-card clickable" role="button" tabindex="0" data-action="detail" data-id="${esc(t.id)}"><div class="task-tick ${t.status==='done'?'done':''}">${t.status==='done'?'✓':'○'}</div><div class="task-body"><div class="task-title">${esc(t.title)}</div><div class="task-sub"><span>${overdue(t)?'🔴 Terlambat ':dueToday(t)?'🕒 Hari ini ':''}${esc(nice(t.due_at))}</span><i class="mini-dot"></i><span>${c.filter(x=>x.is_checked).length}/${c.length} checklist</span><i class="mini-dot"></i><span>📎 ${e.length}</span></div></div><div class="task-right"><div><span class="priority ${t.priority}">${priorityNames[t.priority]}</span><div class="progress-line"><b style="width:${p}%"></b></div></div><div class="small-avatar" title="${esc(n)}">${esc(initials(n))}</div></div></div>`;
}
function empty(icon,title,sub,button=''){return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(sub)}</p>${button}</div>`}
function dashboard(){
 const tasks=state.tasks,done=tasks.filter(t=>t.status==='done'),late=tasks.filter(overdue),active=tasks.filter(t=>t.status!=='done');
 const priorities=[...tasks].filter(t=>t.status!=='done').sort((a,b)=>Number(overdue(b))-Number(overdue(a)) || (a.due_at?+date(a.due_at):Infinity)-(b.due_at?+date(b.due_at):Infinity)).slice(0,5);
 const upcoming=tasks.filter(t=>t.status!=='done'&&(dueSoon(t)||overdue(t))).slice(0,4);
 return `${shiftDashboard()}<section class="welcome"><div><div class="tagline">WORK SMARTER, TOGETHER</div><h2>Halo, ${esc(currentUserName().split(' ')[0])}! 👋<br>Siap produktif hari ini?</h2><p>Pantau semua pekerjaan tim dan selesaikan tepat waktu.</p></div><button class="btn light" data-action="new-task">＋ Tambah tugas</button></section><section class="metrics">${metric('Total tugas',tasks.length,'▤','','Seluruh tugas tim')}${metric('Sedang berjalan',active.length,'↗','','Menunggu penyelesaian')}${metric('Selesai',done.length,'✓','green','Sudah dikonfirmasi')}${metric('Terlambat',late.length,'!','red','Perlu tindak lanjut')}</section><div class="split-layout"><section><div class="section-header"><div><h2>Prioritas pekerjaan</h2><p>Tugas yang perlu perhatian terlebih dahulu</p></div><button class="btn soft sm" data-action="tab" data-tab="tasks">Lihat semua →</button></div><div class="task-list">${priorities.length?priorities.map(taskCard).join(''):empty('🎉','Semua beres!','Tidak ada tugas aktif saat ini.','<button class="btn primary sm" data-action="new-task">Tambah tugas</button>')}</div></section><section><div class="section-header"><div><h2>Pengingat terdekat</h2><p>Deadline 24 jam ke depan & terlambat</p></div></div><div class="panel"><div class="activity">${upcoming.length?upcoming.map(t=>`<div class="activity-line"><div class="bubble">${overdue(t)?'⚠':'⏰'}</div><div><b>${esc(t.title)}</b><small>${overdue(t)?'Terlewat: ':'Batas waktu: '}${esc(niceTime(t.due_at))}</small></div></div>`).join(''):`<p class="small muted">Tidak ada pengingat mendesak. Good job!</p>`}</div><div style="height:1px;background:#f0f3f7;margin:17px 0"></div><h3>Ringkasan checklist</h3><p class="small muted">${state.checks.filter(x=>x.is_checked).length} dari ${state.checks.length} langkah pekerjaan telah dicentang.</p><div class="progress-line" style="width:100%;margin-top:12px;height:8px"><b style="width:${state.checks.length?Math.round(state.checks.filter(x=>x.is_checked).length/state.checks.length*100):0}%"></b></div></div></section></div>`;
}
function tasksPage(){
 const filtered=state.tasks.filter(t=>(state.filter==='all'||(state.filter==='mine'?t.assignee_id===state.user.id:state.filter==='late'?overdue(t):t.status===state.filter))&&(state.priority==='all'||t.priority===state.priority)&&(!state.search||(`${t.title} ${t.description} ${memberName(t.assignee_id)}`).toLowerCase().includes(state.search.toLowerCase())));
 return `<div class="section-header" style="margin-top:0"><div><h2>Manajemen tugas</h2><p>${state.tasks.length} pekerjaan tercatat dalam tim ini</p></div><button class="btn primary" data-action="new-task">＋ Tugas baru</button></div><div class="filter-row"><input id="task-search" class="search" placeholder="Cari tugas atau penanggung jawab…" value="${esc(state.search)}" autocomplete="off"><select id="priority-filter"><option value="all" ${state.priority==='all'?'selected':''}>Semua prioritas</option><option value="high" ${state.priority==='high'?'selected':''}>Tinggi</option><option value="normal" ${state.priority==='normal'?'selected':''}>Sedang</option><option value="low" ${state.priority==='low'?'selected':''}>Rendah</option></select><div class="seg">${[['all','Semua'],['mine','Milik saya'],['doing','Proses'],['done','Selesai'],['late','Telat']].map(([v,l])=>`<button class="${state.filter===v?'active':''}" data-action="filter" data-filter="${v}">${l}</button>`).join('')}</div></div><div class="task-list" id="task-list">${filtered.length?filtered.map(taskCard).join(''):empty('🔎','Tugas tidak ditemukan','Coba ubah filter atau buat tugas baru.')}</div>`;
}
function reportItems(){
 const now=new Date(),start=new Date();start.setHours(0,0,0,0);
 if(state.reportRange==='week'){start.setDate(start.getDate()-6)}
 if(state.reportRange==='month'){start.setDate(start.getDate()-29)}
 return state.tasks.filter(t=>[t.created_at,t.due_at,t.completed_at].some(x=>x&&date(x)>=start&&date(x)<=new Date(now.getTime()+86400000)));
}
function reportsPage(){
 const a=reportItems(),done=a.filter(t=>t.status==='done'),late=a.filter(overdue);
 return photoReportPanel()+`<div class="section-header" style="margin-top:0"><div><h2>Rekap laporan pekerjaan</h2><p>Ringkasan tugas beserta checklist dan bukti pengerjaan</p></div><div class="seg">${[['today','Hari ini'],['week','7 hari'],['month','30 hari']].map(([v,l])=>`<button data-action="report-range" data-value="${v}" class="${state.reportRange===v?'active':''}">${l}</button>`).join('')}</div></div><div class="metrics">${metric('Total laporan',a.length,'▤','','Dalam periode ini')}${metric('Selesai',done.length,'✓','green','Tuntas dikerjakan')}${metric('Belum selesai',a.length-done.length,'⌛','amber','Sedang menunggu')}${metric('Terlambat',late.length,'!','red','Belum terselesaikan')}</div><div class="section-header"><div><h2>Detail laporan</h2><p>Unduh sebagai CSV atau bagikan ke WhatsApp</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn outline sm" data-action="copy-report">Salin laporan</button><button class="btn primary sm" data-action="export-csv">↓ Ekspor CSV</button></div></div><div class="panel table-scroll" style="padding:0">${a.length?`<table class="report-table"><thead><tr><th>Pekerjaan</th><th>Petugas</th><th>Deadline</th><th>Checklist</th><th>Bukti</th><th>Status</th></tr></thead><tbody>${a.map(t=>`<tr><td>${esc(t.title)}</td><td>${esc(memberName(t.assignee_id))}</td><td>${esc(nice(t.due_at))}</td><td>${taskChecks(t.id).filter(x=>x.is_checked).length}/${taskChecks(t.id).length}</td><td>${taskProofs(t.id).length} file</td><td><span class="status-pill ${t.status}">${statusNames[t.status]}</span></td></tr>`).join('')}</tbody></table>`:empty('▤','Belum ada laporan','Tidak ada tugas yang sesuai dengan periode ini.')}</div><div class="notice info" style="margin-top:16px">ⓘ &nbsp; Data laporan mengikuti status tugas dan checklist terbaru yang sudah disimpan.</div>`;
}
// TaskMate v19: galeri bukti foto Shift (cloud only), per tanggal/shift/PIC.
// Tidak ada data foto yang disalin ke GitHub; signed URL berumur pendek.
function photoReportFiltered(){
 return state.photoReportItems.filter(row=>(state.photoReportShift==='all'||row.shift===Number(state.photoReportShift))
  &&(state.photoReportPic==='all'||row.userId===state.photoReportPic));
}
function photoReportPicName(uid){return getProfile(uid)?.full_name||'Petugas belum dikenal'}
function photoReportClock(ts){
 if(!ts)return 'Tidak tercatat';
 const d=new Date(ts);if(!Number.isFinite(d.getTime()))return 'Tidak valid';
 return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)+' WIB';
}
function photoReportPanel(){
 if(!isAdmin())return '';
 const rows=photoReportFiltered();
 const people=[...new Set(state.photoReportItems.map(x=>x.userId).filter(Boolean))];
 const options=[...new Set([...people,...state.members.filter(x=>x.status==='approved').map(x=>x.user_id)])]
   .map(id=>({id,name:photoReportPicName(id)})).sort((a,b)=>a.name.localeCompare(b.name,'id'));
 const all=state.photoReportItems.length;
 const loading=state.photoReportBusy;
 const racks=rows.filter(x=>x.kind==='rack').length;
 const maps=rows.filter(x=>x.kind==='map').length;
 const checks=rows.filter(x=>x.kind==='shift').length;
 return `<section class="photo-report-panel" id="photo-report" aria-label="Laporan foto operasional">
  <div class="photo-report-heading"><div><span class="photo-report-kicker">GALERI BUKTI CLOUD</span><h2>📸 Laporan Foto Shift</h2>
    <p>Foto yang sudah tercatat di Supabase. Hanya Admin Tim yang dapat membuka galeri ini.</p></div>
    <span class="photo-report-private">🔒 Cloud privat</span></div>
  <div class="photo-report-filters">
   <label>Tanggal kerja<input id="photo-report-date" type="date" class="field" value="${esc(state.photoReportDate)}" /></label>
   <label>Shift<select id="photo-report-shift" class="field"><option value="all">Semua shift</option>${[1,2,3].map(n=>`<option value="${n}" ${state.photoReportShift===String(n)?'selected':''}>Shift ${n}</option>`).join('')}</select></label>
   <label>PIC / petugas<select id="photo-report-pic" class="field"><option value="all">Semua petugas</option>${options.map(x=>`<option value="${esc(x.id)}" ${state.photoReportPic===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  </div>
  <div class="photo-report-toolbar">
   <button type="button" class="btn soft sm" data-action="photo-report-load" ${loading?'disabled':''}>${loading?'Memuat foto…':'↻ Muat ulang foto'}</button>
   <button type="button" class="btn primary sm" data-action="photo-report-pdf" ${!rows.length||loading?'disabled':''}>↓ Unduh PDF dengan foto (${rows.length})</button>
  </div>
  ${state.photoReportError?`<p class="photo-report-error" role="alert">${esc(state.photoReportError)}</p>`:''}
  ${state.photoReportLoaded?`<div class="photo-report-stats"><span><b>${rows.length}</b> foto terpilih</span><span>${racks} rak</span><span>${maps} Map Do It</span><span>${checks} tugas shift</span></div>`:''}
  ${!state.photoReportLoaded?`<p class="photo-report-empty">${loading?'Membaca bukti foto dari Supabase…':'Tekan “Muat ulang foto” untuk melihat bukti dari cloud.'}</p>`
  :rows.length===0?`<p class="photo-report-empty">Belum ada foto terverifikasi dalam catatan database untuk filter ini. Periksa tanggal, shift, atau PIC. Foto yang hanya ada di Storage tetapi belum tercatat belum dianggap berhasil dikirim.</p>`
  :`<div class="photo-report-grid">${rows.map(row=>`<article class="photo-report-card">
   ${row.signedUrl?`<button class="photo-report-image" data-action="photo-report-open" data-id="${esc(row.id)}" title="Buka foto ukuran penuh"><img src="${esc(row.signedUrl)}" alt="Bukti foto ${esc(row.title)}" loading="lazy" referrerpolicy="no-referrer" /></button>`:`<div class="photo-report-image photo-report-nopreview">Preview tidak tersedia</div>`}
   <div class="photo-report-info"><span class="photo-report-type">${esc(row.type)}</span><strong>${esc(row.title)}</strong>
   <small>${esc(row.name)} · Shift ${row.shift}</small><small>📷 Diambil: ${esc(photoReportClock(row.capturedAt))}</small>
   <small>☁ Diterima: ${esc(photoReportClock(row.receivedAt))}</small>

   <button type="button" class="btn outline sm" data-action="photo-report-open" data-id="${esc(row.id)}">Lihat foto</button></div>
  </article>`).join('')}</div>`}
  <p class="photo-report-foot">Foto asli tetap tersimpan di bucket privat Supabase. Galeri memakai link sementara; PDF diunduh ke perangkat, tidak disimpan kembali ke cloud. Total foto pada tanggal ini: ${all}.</p>
 </section>`;
}
async function loadPhotoReport(){
 if(!isAdmin()||state.mode!=='cloud'||!state.workspace)throw new Error('Laporan Foto Cloud hanya tersedia untuk Admin Tim yang sudah login.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(state.photoReportDate))throw new Error('Tanggal laporan tidak valid.');
 const wid=state.workspace.id,day=state.photoReportDate,db=state.db;
 state.photoReportBusy=true;state.photoReportError='';state.photoReportLoaded=false;render();
 try{
  const [rack, maps, logs, assignments]=await Promise.all([
   db.from('shift_rack_photos').select('id,workspace_id,work_date,shift_number,assignment_id,user_id,uploaded_by,object_path,client_captured_at,server_received_at,created_at').eq('workspace_id',wid).eq('work_date',day).order('created_at',{ascending:false}).limit(1000),
   db.from('shift_map_photos').select('id,workspace_id,work_date,shift_number,user_id,uploaded_by,rack_note,object_path,client_captured_at,server_received_at,created_at').eq('workspace_id',wid).eq('work_date',day).order('created_at',{ascending:false}).limit(1000),
   db.from('shift_logs').select('id,workspace_id,work_date,shift_number,item_key,completed_by').eq('workspace_id',wid).eq('work_date',day).limit(1000),
   db.from('shift_rack_assignments').select('id,user_id,rack_name').eq('workspace_id',wid).limit(1000)
  ]);
  for(const q of [rack,maps,logs,assignments])if(q.error)throw q.error;
  const rackNames=new Map((assignments.data||[]).map(x=>[x.id,x.rack_name]));
  const shiftLogs=logs.data||[];
  let shiftEvidence=[];
  for(let i=0;i<shiftLogs.length;i+=100){
   const ids=shiftLogs.slice(i,i+100).map(x=>x.id);
   const r=await db.from('shift_evidence').select('id,log_id,uploaded_by,object_path,client_captured_at,server_received_at,created_at,mime_type').in('log_id',ids).limit(1000);
   if(r.error)throw r.error;shiftEvidence.push(...(r.data||[]));
  }
  const logMap=new Map(shiftLogs.map(x=>[x.id,x]));
  const rows=[];
  for(const p of rack.data||[])rows.push({id:'rack:'+p.id,kind:'rack',type:'Sisir Harga',title:'Rak '+(rackNames.get(p.assignment_id)||'Kode rak tidak diketahui'),
   userId:p.user_id,name:photoReportPicName(p.user_id),shift:p.shift_number,bucket:'shift-extra-evidence',path:p.object_path,
   capturedAt:p.client_captured_at,receivedAt:p.server_received_at||p.created_at,signedUrl:''});
  for(const p of maps.data||[])rows.push({id:'map:'+p.id,kind:'map',type:'Map Do It',title:p.rack_note||'Foto display',
   userId:p.user_id,name:photoReportPicName(p.user_id),shift:p.shift_number,bucket:'shift-extra-evidence',path:p.object_path,
   capturedAt:p.client_captured_at,receivedAt:p.server_received_at||p.created_at,signedUrl:''});
  for(const p of shiftEvidence){const l=logMap.get(p.log_id);if(!l)continue;if(!String(p.mime_type||'').startsWith('image/'))continue;
   rows.push({id:'shift:'+p.id,kind:'shift',type:'Checklist Shift',title:(l.item_key||'Tugas').replace(/[-_]/g,' '),
   userId:p.uploaded_by,name:photoReportPicName(p.uploaded_by),shift:l.shift_number,bucket:'shift-evidence',path:p.object_path,
   capturedAt:p.client_captured_at,receivedAt:p.server_received_at||p.created_at,signedUrl:''});
  }
  rows.sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt)));
  // Batch signed URLs; data file tidak pernah disimpan dalam kode/HTML publik.
  for(const bucket of ['shift-extra-evidence','shift-evidence']){
   const grouped=rows.filter(x=>x.bucket===bucket&&x.path);
   for(let i=0;i<grouped.length;i+=80){
    const slice=grouped.slice(i,i+80);
    const r=await db.storage.from(bucket).createSignedUrls(slice.map(x=>x.path),900);
    if(r.error)throw r.error;
    (r.data||[]).forEach((url,j)=>{if(slice[j]&&!url.error)slice[j].signedUrl=url.signedUrl||''});
   }
  }
  if(state.workspace?.id!==wid||state.photoReportDate!==day)return;
  state.photoReportItems=rows;state.photoReportLoaded=true;
 }catch(e){state.photoReportError='Gagal memuat foto dari cloud: '+errMessage(e);state.photoReportItems=[];state.photoReportLoaded=true;}
 finally{state.photoReportBusy=false;render()}
}
async function openPhotoReportFile(id){
 if(!isAdmin()||state.mode!=='cloud')return;
 const item=state.photoReportItems.find(x=>x.id===id);if(!item)throw new Error('Bukti foto tidak ditemukan dalam laporan.');
 const tab=window.open('about:blank','_blank');
 const r=await state.db.storage.from(item.bucket).createSignedUrl(item.path,120);
 if(r.error){tab?.close();throw r.error}
 if(tab)tab.location.href=r.data.signedUrl;
 else window.location.href=r.data.signedUrl;
}
function photoReportJpeg(blob){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob);const image=new Image();
  image.onload=()=>{try{
   const max=1250,ratio=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   resolve({data:canvas.toDataURL('image/jpeg',0.74),ratio:canvas.width/canvas.height});
  }catch(e){reject(e)}finally{URL.revokeObjectURL(url)}};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Format gambar tidak terbaca'));};image.src=url;
 });
}
async function exportPhotoReportPdf(){
 if(!isAdmin())throw new Error('Laporan PDF khusus Admin Tim');
 if(state.mode!=='cloud')throw new Error('Laporan PDF hanya dapat diunduh dari mode cloud');
 const photos=photoReportFiltered();if(!photos.length)throw new Error('Tidak ada foto untuk filter ini.');
 if(photos.length>100)throw new Error('Terlalu banyak foto untuk satu PDF di HP. Pilih satu shift atau PIC terlebih dahulu (maksimum 100 foto).');
 if(!window.jspdf?.jsPDF)throw new Error('Pembuat PDF belum termuat. Pastikan HP memiliki koneksi internet dan refresh aplikasi.');
 const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const w=210,h=297,margin=15;
 pdf.setFillColor(25,38,62);pdf.rect(0,0,w,50,'F');pdf.setTextColor(255);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('TASKMATE | LAPORAN FOTO SHIFT',margin,26);
 pdf.setFontSize(10);pdf.setTextColor(56,70,86);pdf.text('Tim: '+(state.workspace?.name||'-'),margin,66);
 pdf.text('Tanggal kerja: '+state.photoReportDate,margin,74);
 pdf.text('Shift: '+(state.photoReportShift==='all'?'Semua':state.photoReportShift),margin,82);
 pdf.text('PIC: '+(state.photoReportPic==='all'?'Semua':photoReportPicName(state.photoReportPic)),margin,90);
 pdf.text('Foto tercatat: '+photos.length,margin,98);
 pdf.text('Dibuat: '+photoReportClock(new Date().toISOString()),margin,106);
 pdf.setFontSize(10);pdf.setTextColor(100);pdf.text('Sumber: Supabase Storage privat + catatan database TaskMate.',margin,118);
 pdf.setFontSize(9);pdf.text('Waktu HP pada foto perlu dibandingkan dengan waktu diterima server.',margin,125);
 let no=0,fail=0;
 for(const item of photos){
  no++;pdf.addPage();pdf.setFillColor(25,38,62);pdf.rect(0,0,w,20,'F');pdf.setTextColor(255);pdf.setFontSize(10);pdf.setFont('helvetica','bold');pdf.text('FOTO BUKTI '+no+' / '+photos.length,margin,13);
  pdf.setTextColor(38,51,67);pdf.setFont('helvetica','bold');pdf.setFontSize(14);pdf.text(pdf.splitTextToSize(item.title,180),margin,32);
  pdf.setFont('helvetica','normal');pdf.setFontSize(9);
  pdf.text('Jenis: '+item.type+' | Shift '+item.shift,margin,47);
  pdf.text('PIC: '+item.name,margin,54);
  pdf.text('Diambil: '+photoReportClock(item.capturedAt),margin,61);
  pdf.text('Diterima server: '+photoReportClock(item.receivedAt),margin,68);
  let imageY=82;
  try{
   const res=await state.db.storage.from(item.bucket).createSignedUrl(item.path,120);
   if(res.error)throw res.error;
   const file=await fetch(res.data.signedUrl);if(!file.ok)throw new Error('HTTP '+file.status);
   const jpg=await photoReportJpeg(await file.blob());
   const maxW=180,maxH=195;
   let iw=maxW,ih=iw/jpg.ratio;
   if(ih>maxH){ih=maxH;iw=ih*jpg.ratio}
   pdf.addImage(jpg.data,'JPEG',(w-iw)/2,imageY,iw,ih,undefined,'FAST');
  }catch(e){fail++;pdf.setTextColor(190,64,64);pdf.text('Foto gagal dimuat dari Storage saat membuat PDF: '+String(errMessage(e)).slice(0,80),margin,90);}
  pdf.setTextColor(123);pdf.setFontSize(8);pdf.text('Laporan internal - jangan sebarkan tanpa izin.',margin,286);
 }
 const filename='TaskMate_Laporan_Foto_'+state.photoReportDate+'_Shift-'+state.photoReportShift+'.pdf';
 pdf.save(filename);notify('PDF '+photos.length+' foto dibuat'+(fail?' · '+fail+' gambar gagal dimuat':'')+'.');
}

function teamPage(){
 const code=state.workspace.invite_code,admin=isAdmin(),members=state.members.filter(m=>m.status==='approved'),pending=state.members.filter(m=>m.status==='pending'),other=state.members.filter(m=>m.status==='rejected'||m.status==='disabled');
 const adminButton=(m,action,label,cls='outline')=>`<button class="btn ${cls} sm" type="button" data-action="manage-member" data-id="${esc(m.user_id)}" data-member-action="${action}">${label}</button>`;
 const linkedIds=new Set(state.staffLinks.map(l=>l.user_id));
 const availableExcel=IMPORTED.staff.filter(p=>!state.staffLinks.some(l=>l.staff_key===p.key));
 const linkButton=m=>state.mode==='cloud'&&availableExcel.length?`<button class="btn primary sm" type="button" data-action="approve-link-open" data-id="${esc(m.user_id)}">${m.status==='pending'?'✓ Setujui + Tautkan':'🔗 Tautkan ke Excel'}</button>`:'';

 const person=(m)=>`<div class="person-row" style="flex-wrap:wrap;gap:10px"><div class="avatar">${esc(initials(memberName(m.user_id)))}</div><div style="flex:1;min-width:130px"><strong>${esc(memberName(m.user_id))}</strong><br><span>${m.user_id===state.user.id?'Akun Anda':m.status==='pending'?'Menunggu persetujuan':m.status==='disabled'?'Akses nonaktif':m.status==='rejected'?'Ditolak':m.role==='admin'?'Admin':'Karyawan'}</span></div><span class="status-pill ${m.status==='approved'&&m.role==='admin'?'doing':''}">${m.status==='pending'?'Pending':m.status==='disabled'?'Nonaktif':m.status==='rejected'?'Ditolak':m.role==='admin'?'Admin':'Aktif'}</span>${admin?`<div style="display:flex;gap:6px;flex-wrap:wrap;width:100%;margin:3px 0 0 48px">${m.status==='pending'?linkButton(m)+adminButton(m,'approve','Setujui tanpa tautan')+adminButton(m,'reject','Tolak','danger'):m.status==='approved'?(linkedIds.has(m.user_id)?'':linkButton(m))+adminButton(m,m.role==='admin'?'demote':'promote',m.role==='admin'?'Jadikan karyawan':'Jadikan admin')+adminButton(m,'disable','Nonaktifkan','danger'):adminButton(m,'reactivate','Aktifkan kembali')}</div>`:''}</div>`;
 return `<div class="section-header" style="margin-top:0"><div><h2>Manajemen Akun & Tim</h2><p>Setujui karyawan sebelum mereka mengakses data toko</p></div>${state.mode==='cloud'?`<button class="btn outline sm" data-action="open-workspace">＋ Tim lainnya</button>`:''}</div>
 <div class="notice info" style="margin-bottom:12px">🔒 Karyawan baru tidak otomatis memperoleh akses. Admin dapat memilih <b>Setujui + Tautkan</b>, lalu memilih nama Excel yang benar. Jadwal dan rak langsung disinkronkan tanpa perlu klik ulang. Karyawan nonaktif tidak dapat membaca data tim.</div>
 ${admin?`<section class="panel" style="margin-bottom:14px"><h3>Permintaan Persetujuan · ${pending.length}</h3>${pending.length?pending.map(person).join(''):'<p class="small muted">Tidak ada permintaan baru.</p>'}</section>`:''}
 <div class="split-layout"><section class="panel"><h3>Anggota Aktif · ${members.length}</h3>${members.length?members.map(person).join(''):'<p class="small muted">Belum ada anggota aktif.</p>'}${admin&&other.length?`<div style="margin-top:18px"><h3>Ditolak / Dinonaktifkan · ${other.length}</h3>${other.map(person).join('')}</div>`:''}</section>
 <section class="panel"><h3>Kode Undangan Tim</h3><p class="small muted">Bagikan hanya ke calon karyawan. Mereka tetap perlu disetujui admin setelah memasukkan kode ini.</p><div class="codebox"><strong>${esc(code)}</strong><p>${state.mode==='demo'?'Kode contoh':'Kode tim — persetujuan tetap wajib'}</p></div><button class="btn soft block" data-action="copy-code">⧉ Salin kode tim</button><button class="btn outline block" style="margin-top:10px" data-action="sync">↻ Perbarui daftar anggota</button><p class="small muted" style="margin-top:15px">Perubahan status berlaku di server Supabase. Akun yang dinonaktifkan harus disetujui ulang bila ingin menggunakan tim ini.</p></section></div>`;
}
function settingsPage(){
 return `<div class="section-header" style="margin-top:0"><div><h2>Pengaturan aplikasi</h2><p>Pengingat, akun, dan koneksi cloud</p></div></div>${personalThemePicker()}<div class="panel"><div class="settings-item"><div><h4>Mode penyimpanan</h4><p>${state.mode==='cloud'?'Supabase — data tim tersimpan online dan tersinkron antar HP.':'Demo — data hanya tersimpan lokal di perangkat ini.'}</p></div><span class="chip ${state.mode==='demo'?'demo':''}"><i class="dot"></i>${state.mode==='demo'?'Lokal':'Cloud'}</span></div><div class="settings-item"><div><h4>Notifikasi deadline</h4><p>Aktifkan pengingat browser saat aplikasi sedang terbuka (30 menit sebelum deadline).</p></div><button class="btn soft sm" data-action="notifications">${typeof Notification!=='undefined'&&Notification.permission==='granted'?'Sudah aktif':'Aktifkan'}</button></div><div class="settings-item"><div><h4>Sinkronisasi HP ↔ Cloud</h4><p>Tarik data terbaru dari Supabase. Terakhir: ${state.lastSync?esc(niceTime(state.lastSync)):'Belum pernah'}.</p></div><button class="btn outline sm" data-action="sync">↻ Sinkronkan sekarang</button></div><div class="settings-item"><div><h4>Pengaturan server Supabase</h4><p>${state.mode==='cloud'?'Proyek cloud terhubung.':'Hubungkan proyek Supabase untuk memakai banyak HP.'}</p></div><button class="btn outline sm" data-action="open-config">${state.mode==='cloud'?'Lihat konfigurasi':'Hubungkan'}</button></div>${state.mode==='cloud'?`<div class="settings-item"><div><h4>Akun pengguna</h4><p>${esc(state.user?.email||'')} · ${esc(currentUserName())}</p></div><button class="btn danger sm" data-action="logout">Keluar</button></div>`:`<div class="settings-item"><div><h4>Reset data demo</h4><p>Hapus tugas demo pada perangkat ini dan kembalikan data contoh.</p></div><button class="btn danger sm" data-action="reset-demo">Reset</button></div>`}</div><div class="notice info" style="margin-top:18px">🔒 &nbsp; Foto bukti pada mode cloud menggunakan bucket privat. Hanya anggota tim yang memiliki akses.</div>`;
}
function authPage(){
 const signup=state.authTab==='signup';
 return `<div class="auth-wrap"><div class="auth-card"><div class="auth-brand"><span>✓</span> TaskMate</div><h1>${signup?'Buat akun baru':'Selamat datang kembali'}</h1><p>${signup?'Buat akun untuk bekerja bersama tim di beberapa HP.':'Login untuk mengakses tugas, laporan, dan bukti pekerjaan tim Anda.'}</p><div class="auth-tabs"><button data-action="auth-tab" data-tab="login" class="${signup?'':'active'}">Masuk</button><button data-action="auth-tab" data-tab="signup" class="${signup?'active':''}">Daftar akun</button></div><form id="auth-form">${signup?`<div class="form-grp"><label>Nama lengkap</label><input class="field" name="full_name" placeholder="Nama Anda" maxlength="100" required></div>`:''}<div class="form-grp"><label>Email</label><input class="field" type="email" name="email" placeholder="nama@email.com" required autocomplete="email"></div><div class="form-grp"><label>Password</label><input class="field" type="password" name="password" minlength="6" required autocomplete="${signup?'new-password':'current-password'}" placeholder="Minimal 6 karakter"></div><button class="btn primary block" type="submit">${signup?'Daftar sekarang':'Masuk ke TaskMate'}</button></form><div class="back-link" data-action="forgot-pass">Lupa password?</div><div class="back-link" data-action="demo-mode">← Coba demo tanpa login</div></div></div>`;
}
function noWorkspacePage(){
 const requests=state.joinRequests||[];
 const statusLabels={pending:'Menunggu persetujuan admin',rejected:'Ditolak admin',disabled:'Akses dinonaktifkan'};
 return `<div class="auth-wrap"><div class="auth-card"><div class="auth-brand"><span>✓</span> TaskMate</div><h1>Gabung ke Tim TaskMate</h1><p>Buat tim baru atau ajukan bergabung menggunakan kode dari admin. Akun baru hanya bisa melihat data setelah disetujui.</p>
 ${requests.length?`<section class="panel" style="padding:14px;margin-bottom:18px"><h3>Status permintaan saya</h3>${requests.map(r=>`<div class="person-row" style="gap:8px"><div style="flex:1"><b>${esc(r.workspace_name)}</b><br><span class="small muted">${esc(statusLabels[r.member_status]||r.member_status)}</span></div><span class="status-pill ${r.member_status==='pending'?'doing':''}">${r.member_status==='pending'?'Diproses':r.member_status==='disabled'?'Nonaktif':'Ditolak'}</span></div>`).join('')}<button class="btn outline block" data-action="refresh-requests" style="margin-top:10px">↻ Cek status terbaru</button></section>`:''}
 <form id="create-workspace"><div class="form-grp"><label>Nama tim baru</label><input class="field" name="name" required minlength="2" maxlength="100" placeholder="Contoh: Tim Toko"></div><button class="btn primary block" type="submit">＋ Buat tim baru (sebagai admin)</button></form>
 <div style="text-align:center;color:#9ca9b8;font-size:12px;margin:21px">— ATAU —</div><form id="join-workspace"><div class="form-grp"><label>Kode undangan dari admin</label><input class="field" name="code" required placeholder="Contoh: A1B2C3D4" style="text-transform:uppercase"></div><button class="btn outline block" type="submit">Kirim permintaan gabung</button></form><p class="small muted" style="margin-top:12px">Permintaan harus disetujui admin sebelum Anda dapat membaca jadwal dan tugas tim.</p><div class="back-link" data-action="logout">Keluar dari akun</div></div></div>`;
}
function render(){
 applyPersonalTheme();
 let html;
 if(state.mode==='cloud'&&!state.user)html=authPage();
 else if(state.mode==='cloud'&&!state.workspace)html=noWorkspacePage();
 else html=shell(({home:dashboard,shift:shiftPage,tasks:tasksPage,reports:reportsPage,team:teamPage,settings:settingsPage})[state.tab]());
 for(const el of document.querySelectorAll('[data-taskmate-inner-scroll]')){
  const key=el.dataset.taskmateScrollScope||`${state.shiftDate}:${state.shiftNumber}:${el.dataset.taskmateInnerScroll}`;
  tmInnerScrollMemory.set(key,el.scrollTop);
 }
 $('#app').innerHTML=html+(state.modal?modalHtml():'');
 for(const el of document.querySelectorAll('[data-taskmate-inner-scroll]')){
  const key=el.dataset.taskmateScrollScope||`${state.shiftDate}:${state.shiftNumber}:${el.dataset.taskmateInnerScroll}`;
  if(tmInnerScrollMemory.has(key))el.scrollTop=tmInnerScrollMemory.get(key);
 }
 if(state.mode==='cloud'){hydrateProofThumbs();hydrateShiftThumbs();}
}
async function hydrateProofThumbs(){
 for(const el of $$('[data-proof-thumb]')){
  const proof=state.evidence.find(p=>p.id===el.dataset.proofThumb);
  if(!proof)continue;
  let record=signedThumbs.get(proof.object_path);
  if(!record || record.exp < Date.now()){
   const {data,error}=await state.db.storage.from('task-evidence').createSignedUrl(proof.object_path,120);
   if(error)continue;
   record={url:data.signedUrl,exp:Date.now()+100000};signedThumbs.set(proof.object_path,record);
  }
  if(el.isConnected){const img=document.createElement('img');img.src=record.url;img.alt='Bukti pekerjaan';el.replaceWith(img)}
 }
}
function modalFrame(title,subtitle,body,footer=''){return `<div class="modal-scrim" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button type="button" class="icon-btn" aria-label="Tutup" data-action="close-modal">✕</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div>`}
function taskForm(t=null){
 const isEdit=!!t;
 const opts=state.members.filter(m=>m.status==='approved'||state.mode==='demo').map(m=>`<option value="${esc(m.user_id)}" ${(t?.assignee_id||state.user.id)===m.user_id?'selected':''}>${esc(memberName(m.user_id))}</option>`).join('');
 const body=`<form id="task-form"><div class="form-grp"><label>Nama pekerjaan *</label><input class="field" name="title" maxlength="200" minlength="2" required placeholder="Contoh: Checklist kebersihan area" value="${esc(t?.title||'')}"></div><div class="form-grp"><label>Deskripsi / instruksi</label><textarea class="field" name="description" placeholder="Jelaskan apa yang perlu dikerjakan…">${esc(t?.description||'')}</textarea></div><div class="form-grid"><div class="form-grp"><label>Penanggung jawab</label><select class="field" name="assignee_id"><option value="">Belum ditugaskan</option>${opts}</select></div><div class="form-grp"><label>Prioritas</label><select class="field" name="priority">${[['low','Rendah'],['normal','Sedang'],['high','Tinggi']].map(([v,n])=>`<option value="${v}" ${(t?.priority||'normal')===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="form-grp"><label>Batas waktu / reminder</label><input class="field" type="datetime-local" name="due_at" value="${t?.due_at?esc(dateLocal(t.due_at)):esc(dateLocal(getIso(1)))}"></div><div class="form-grp"><label>Kategori pekerjaan</label><input class="field" name="category" maxlength="60" value="${esc(t?.category||'Operasional')}" placeholder="Operasional"></div></div><label class="checkline"><input type="checkbox" name="evidence_required" ${t?.evidence_required?'checked':''}><span>Wajib upload bukti sebelum tugas selesai</span></label><div class="status-bar" style="justify-content:flex-end"><button class="btn ghost" type="button" data-action="close-modal">Batal</button><button class="btn primary" type="submit">${isEdit?'Simpan perubahan':'＋ Buat tugas'}</button></div></form>`;
 return modalFrame(isEdit?'Edit pekerjaan':'Tambah pekerjaan baru',isEdit?'Perbarui informasi dan deadline tugas':'Atur tugas dan tugaskan kepada anggota tim',body);
}
function taskDetail(id){
 const t=state.tasks.find(x=>x.id===id);if(!t)return modalFrame('Tugas tidak ditemukan','', '<p>Tugas sudah dihapus. Tutup jendela ini.</p>');
 const checks=taskChecks(id),proofs=taskProofs(id),p=progress(t),canFinish=!checks.some(x=>!x.is_checked)&&(!t.evidence_required||proofs.length>0);
 const body=`<div class="detail-grid"><div class="detail-cell"><span>Penanggung jawab</span><b>${esc(memberName(t.assignee_id))}</b></div><div class="detail-cell"><span>Status</span><b>${statusNames[t.status]}</b></div><div class="detail-cell"><span>Deadline</span><b style="color:${overdue(t)?'#d95664':'inherit'}">${esc(niceTime(t.due_at))}</b></div><div class="detail-cell"><span>Prioritas</span><b>${priorityNames[t.priority]} · ${esc(t.category)}</b></div></div>${t.description?`<p class="description">${esc(t.description)}</p>`:''}<div class="detail-head"><h3>Checklist pekerjaan <span class="muted small">(${checks.filter(x=>x.is_checked).length}/${checks.length})</span></h3><b class="small" style="color:#4677df">${p}%</b></div><div class="progress-line" style="width:100%;height:8px;margin-bottom:13px"><b style="width:${p}%"></b></div>${checks.map(c=>`<label class="detail-check ${c.is_checked?'checked':''}"><input type="checkbox" data-action="toggle-check" data-id="${esc(c.id)}" ${c.is_checked?'checked':''}><span style="flex:1">${esc(c.title)}</span>${c.is_checked?'<small>✓</small>':''}<button class="icon-btn" style="width:26px;height:26px;font-size:12px" title="Hapus checklist" type="button" data-action="delete-check" data-id="${esc(c.id)}">✕</button></label>`).join('')}${!checks.length?`<p class="small muted" style="margin-bottom:10px">Tambahkan langkah pekerjaan agar bisa dicentang satu per satu.</p>`:''}<form id="add-check" class="add-inline"><input class="field" name="title" required maxlength="200" placeholder="＋ Tambah item checklist"><button class="btn soft" type="submit">Tambah</button></form><div class="detail-head" style="margin-top:25px"><h3>Foto / bukti pengerjaan <span class="muted small">(${proofs.length})</span></h3></div>${proofs.length?`<div class="evidence-grid" style="margin-bottom:12px">${proofs.map(x=>`<div class="proof" tabindex="0" role="button" data-action="open-proof" data-id="${esc(x.id)}">${x.data_url&&x.mime_type.startsWith('image/')?`<img alt="Bukti pekerjaan" src="${x.data_url}">`:(state.mode==='cloud'&&x.mime_type.startsWith('image/')?`<div class="proof-icon" data-proof-thumb="${esc(x.id)}">📷</div>`:`<div class="proof-icon">${x.mime_type==='application/pdf'?'📄':'📷'}</div>`) }<div class="proof-name" title="${esc(x.file_name)}">${esc(x.file_name)}</div>${x.mime_type?.startsWith('image/')?photoAuditBadge(x):''}</div>`).join('')}</div>`:`<p class="small muted" style="margin-bottom:12px">Belum ada bukti pengerjaan yang diunggah.</p>`}<button type="button" class="upload-zone" data-action="camera-open" data-kind="task" data-id="${esc(id)}" style="width:100%">📷 &nbsp; Ambil foto langsung + watermark</button><label class="upload-zone" style="display:block;margin-top:8px">📄 &nbsp; Lampiran PDF (bukan foto bukti)<input type="file" data-action="upload-proof" data-task="${esc(id)}" accept="application/pdf"></label>${t.evidence_required?'<p class="small" style="margin-top:9px;color:#ca7a1f">⚠ Tugas ini wajib memiliki minimal satu bukti.</p>':''}<div class="status-bar"><button class="btn ghost sm" data-action="edit-task" data-id="${esc(id)}">✎ Edit tugas</button>${canDelete(t)&&proofs.length===0?`<button class="btn danger sm" data-action="delete-task" data-id="${esc(id)}">Hapus</button>`:''}<span style="flex:1"></span>${t.status==='todo'?`<button class="btn soft sm" data-action="status" data-status="doing" data-id="${esc(id)}">Mulai tugas</button>`:''}${t.status==='done'?`<button class="btn outline sm" data-action="status" data-status="doing" data-id="${esc(id)}">Buka kembali</button>`:`<button class="btn primary sm" ${canFinish?'':'disabled title="Lengkapi checklist dan bukti terlebih dahulu"'} data-action="status" data-status="done" data-id="${esc(id)}">✓ Tandai selesai</button>`}</div>${!canFinish&&t.status!=='done'?`<p class="small muted" style="margin-top:9px">Selesaikan semua checklist ${t.evidence_required?'dan upload minimal satu bukti ':''}sebelum menandai selesai.</p>`:''}`;
 return modalFrame(t.title,`Dibuat ${nice(t.created_at)} · ${esc(memberName(t.created_by))}`,body);
}
function configModal(){
 const c=config(),file=window.TASKMATE_CONFIG||{};const locked=!!file.supabaseUrl&&!!file.supabaseAnonKey;
 const body=`<div class="notice info"><span>ⓘ</span><span>Masukkan <b>Project URL</b> dan <b>publishable / anon key</b> dari Supabase. Jangan gunakan service_role/secret key.</span></div>${locked?`<p class="small muted">Koneksi diatur dari file <b>config.js</b> yang terpasang pada hosting. Ubah file itu untuk mengganti proyek.</p>`:`<form id="config-form"><div class="form-grp"><label>Supabase Project URL</label><input class="field" name="url" type="url" required value="${esc(c.url)}" placeholder="https://xxxx.supabase.co"></div><div class="form-grp"><label>Supabase publishable / anon key</label><input class="field" name="key" required value="${esc(c.key)}" placeholder="sb_publishable_... atau eyJ..."></div><button class="btn primary block" type="submit">Simpan & hubungkan</button></form>`}<p class="small muted" style="margin-top:15px">Sebelum menghubungkan, jalankan file <b>schema.sql</b> di menu Supabase SQL Editor. Untuk penggunaan beberapa HP, hosting semua file ini di satu alamat HTTPS.</p>${state.mode==='cloud'&&!locked?`<button class="btn danger sm" style="margin-top:15px" data-action="disconnect-cloud">Ganti ke mode demo</button>`:''}`;
 return modalFrame('Hubungkan Supabase','Sinkronisasi tugas, laporan, dan foto dari beberapa HP',body);
}
function workspaceModal(){return modalFrame('Gabung / buat tim lain','Akun yang sama bisa bergabung dalam beberapa tim',`<form id="create-workspace"><div class="form-grp"><label>Nama tim baru</label><input class="field" name="name" minlength="2" required placeholder="Tim Lapangan"></div><button class="btn primary block" type="submit">Buat tim</button></form><p class="small muted" style="text-align:center;margin:18px 0">ATAU · Persetujuan admin wajib untuk bergabung</p><form id="join-workspace"><div class="form-grp"><label>Kode undangan</label><input class="field" name="code" required placeholder="8 karakter" style="text-transform:uppercase"></div><button class="btn outline block" type="submit">Gabung tim</button></form>${state.workspaces.length>1?`<div class="detail-head"><h3>Tim yang diikuti</h3></div>${state.workspaces.map(w=>`<button class="btn ${state.workspace?.id===w.id?'primary':'ghost'} sm" style="margin:3px" data-action="switch-workspace" data-id="${esc(w.id)}">${esc(w.name)}</button>`).join('')}`:''}`)}
function approveLinkModal(){
 const userId=state.modal?.id;
 const member=state.members.find(m=>m.user_id===userId);
 if(!isAdmin()||!member||!['pending','approved'].includes(member.status))return modalFrame('Akun tidak dapat ditautkan','Perbarui daftar anggota terlebih dahulu','<p>Permintaan sudah berubah atau tidak tersedia.</p>');
 if(state.staffLinks.some(l=>l.user_id===userId))return modalFrame('Akun sudah tertaut','', '<p>Akun ini sudah memiliki nama Excel.</p>');
 const available=IMPORTED.staff.filter(p=>!state.staffLinks.some(l=>l.staff_key===p.key));
 const selections=available.map(p=>`<option value="${esc(p.key)}">${esc(p.name)} · ${p.racks.length} rak</option>`).join('');
 return modalFrame('Setujui + Tautkan + Sinkronkan',`Akun: ${memberName(userId)}`,
 `<div class="notice info" style="margin-bottom:14px">Pilih nama karyawan <b>berdasarkan identitas sebenarnya</b>, bukan hanya kemiripan nama. Admin tetap memutuskan penautannya.</div>
 ${available.length?`<form id="approve-link-form">
 <input type="hidden" name="user_id" value="${esc(userId)}">
 <div class="form-grp"><label>Nama sesuai file Excel</label><select class="field" name="staff_key" required>
 <option value="">— Pilih nama karyawan —</option>${selections}</select></div>
 <p class="small muted">Klik Simpan untuk ${member.status==='pending'?'menyetujui akun, ':''}menghubungkan identitas dan membuat jadwal serta nomor rak. Riwayat checklist tidak dihapus.</p>
 <button class="btn primary block" type="submit">✓ ${member.status==='pending'?'Setujui + Tautkan + Sinkronkan':'Tautkan + Sinkronkan'}</button>
 </form>`:'<p>Semua nama Excel telah ditautkan. Impor Excel lebih dulu bila ada karyawan baru.</p>'}
 ${member.status==='pending'?`<button class="btn outline block" style="margin-top:12px" type="button" data-action="approve-without-link" data-id="${esc(userId)}">Setujui saja (tautkan nanti)</button>`:''}`);
}
async function approveLink(form){
 if(state.mode!=='cloud'||!isAdmin()||!state.workspace)throw new Error('Hanya admin tim yang bisa menautkan akun.');
 const fd=new FormData(form),userId=String(fd.get('user_id')||''),key=String(fd.get('staff_key')||'');
 const member=state.members.find(m=>m.user_id===userId),person=IMPORTED.staff.find(p=>p.key===key);
 if(!member||!['pending','approved'].includes(member.status)||!person)throw new Error('Pilih akun dan nama Excel yang valid.');
 if(state.staffLinks.some(l=>l.user_id===userId||l.staff_key===key))throw new Error('Akun atau nama Excel sudah tertaut.');
 if(!confirm(`Pastikan identitas berikut benar:\nAkun login: ${memberName(userId)}\nNama Excel: ${person.name}\nRak: ${person.racks.length}\n\nLanjutkan ${member.status==='pending'?'persetujuan, ':''}penautan dan sinkronisasi?`))return;
 const {data,error}=await state.db.rpc('approve_and_link_imported_staff',{
  p_workspace:state.workspace.id,p_user:userId,p_staff_key:key
 });
 if(error)throw error;
 state.modal=null;
 await refreshCloud();
 notify(`${data?.staff_name||person.name} berhasil ditautkan · ${data?.racks??person.racks.length} rak · ${data?.scheduled_shifts??0} jadwal tersinkron.`);
}
async function manageMember(userId,action){
 if(state.mode!=='cloud'||!state.workspace||!isAdmin())throw new Error('Hanya admin tim yang boleh mengelola akun.');
 const member=state.members.find(m=>m.user_id===userId);
 const labels={approve:'menyetujui',reject:'menolak',disable:'menonaktifkan',reactivate:'mengaktifkan kembali',promote:'menjadikan admin',demote:'menjadikan karyawan'};
 if(!member||!labels[action])throw new Error('Tindakan tidak valid.');
 const name=memberName(userId);
 if(!confirm(`Yakin ingin ${labels[action]} akun ${name}?`))return;
 const {error}=await state.db.rpc('manage_workspace_member',{p_workspace:state.workspace.id,p_user:userId,p_action:action});
 if(error)throw error;
 await refreshCloud();notify(`Akun ${name} berhasil diperbarui.`);
}
function modalHtml(){if(!state.modal)return '';if(state.modal.type==='task')return taskForm(state.modal.id?state.tasks.find(t=>t.id===state.modal.id):null);if(state.modal.type==='detail')return taskDetail(state.modal.id);if(state.modal.type==='config')return configModal();if(state.modal.type==='workspace')return workspaceModal();if(state.modal.type==='approve-link')return approveLinkModal();if(state.modal.type==='shift-point')return shiftPointForm(state.modal.id||null);return ''}
function modal(type,id){state.modal={type,id};render()}
function closeModal(){state.modal=null;render()}
async function afterMutation(){if(state.mode==='demo'){persistDemo();render();checkReminders()}else await refreshCloud()}
async function saveTask(form){
 const fd=new FormData(form),payload={title:String(fd.get('title')||'').trim(),description:String(fd.get('description')||'').trim(),category:String(fd.get('category')||'Operasional').trim()||'Umum',priority:fd.get('priority'),assignee_id:fd.get('assignee_id')||null,due_at:fd.get('due_at')?new Date(fd.get('due_at')).toISOString():null,evidence_required:fd.get('evidence_required')==='on'};
 if(payload.title.length<2){notify('Nama tugas minimal 2 karakter',true);return}
 const edit=state.modal?.id;
 if(state.mode==='demo'){
  if(edit){const t=state.tasks.find(x=>x.id===edit);Object.assign(t,payload,{updated_at:new Date().toISOString()});}
  else state.tasks.unshift({id:uid(),workspace_id:state.workspace.id,created_by:state.user.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),status:'todo',completed_at:null,...payload});
 }else{
  const q=edit?state.db.from('tasks').update(payload).eq('id',edit):state.db.from('tasks').insert({workspace_id:state.workspace.id,created_by:state.user.id,...payload});
  const {error}=await q;if(error)throw error;
 }
 state.modal=edit?{type:'detail',id:edit}:null;await afterMutation();notify(edit?'Tugas diperbarui':'Tugas baru berhasil dibuat');
}
async function addCheck(form){const title=String(new FormData(form).get('title')||'').trim();if(!title)return;const tid=state.modal?.id;
 const item={task_id:tid,title,position:taskChecks(tid).length+1,is_checked:false};
 if(state.mode==='demo')state.checks.push({id:uid(),...item});else{const {error}=await state.db.from('task_checklists').insert(item);if(error)throw error}
 await afterMutation();notify('Checklist ditambahkan');
}
async function toggleCheck(id,checked){
 const obj={is_checked:checked,checked_by:checked?state.user.id:null,checked_at:checked?new Date().toISOString():null};
 if(state.mode==='demo'){Object.assign(state.checks.find(x=>x.id===id),obj)}else{const {error}=await state.db.from('task_checklists').update(obj).eq('id',id);if(error)throw error}
 await afterMutation();
}
async function deleteCheck(id){if(state.mode==='demo')state.checks=state.checks.filter(c=>c.id!==id);else{const {error}=await state.db.from('task_checklists').delete().eq('id',id);if(error)throw error}await afterMutation()}
async function updateStatus(id,status){
 const t=state.tasks.find(t=>t.id===id);if(status==='done'&&(taskChecks(id).some(x=>!x.is_checked)||(t.evidence_required&&!taskProofs(id).length))){notify('Lengkapi checklist dan bukti yang diwajibkan.',true);return}
 if(state.mode==='demo'){t.status=status;t.completed_at=status==='done'?new Date().toISOString():null;t.updated_at=new Date().toISOString()}else{const {error}=await state.db.from('tasks').update({status}).eq('id',id);if(error)throw error}
 await afterMutation();notify(status==='done'?'Pekerjaan ditandai selesai':'Status tugas diperbarui');
}
async function deleteTask(id){const t=state.tasks.find(x=>x.id===id);if(!t||!canDelete(t))return;if(taskProofs(id).length){notify('Tugas dengan bukti tidak bisa dihapus dari aplikasi.',true);return}if(!confirm('Hapus tugas ini beserta semua checklist-nya?'))return;
 if(state.mode==='demo'){state.tasks=state.tasks.filter(x=>x.id!==id);state.checks=state.checks.filter(x=>x.task_id!==id)}else{const {error}=await state.db.from('tasks').delete().eq('id',id);if(error)throw error}
 state.modal=null;await afterMutation();notify('Tugas dihapus');
}
function fileAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function stampDateTimeParts(now=new Date()){
 const pad=n=>String(n).padStart(2,'0');
 return {date:`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,time:`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`};
}
function shiftItemTitle(key,s=state.shiftNumber){
 for(const area of shiftAreasFor(s)){for(const item of area.items){if(item[0]===key)return item[1];}}
 return key;
}
function buildWatermarkMeta(meta={}){
 const now=meta.now instanceof Date?meta.now:new Date();
 const parts=stampDateTimeParts(now);
 const userName=meta.userName||currentUserName();
 const shiftInfo=meta.shiftNumber?`Shift ${meta.shiftNumber}`:'';
 const item=meta.itemLabel||meta.rackName||'';
 const area=meta.areaLabel||'';
 const line1='TASKMATE • BUKTI PEKERJAAN';
 const line2=`${parts.date} ${parts.time} • ${userName}${shiftInfo?` • ${shiftInfo}`:''}`;
 const line3=[item,area].filter(Boolean).join(' • ');
 return {line1,line2,line3,date:parts.date,time:parts.time,stampedAt:now.toISOString()};
}
function watermarkedImage(file,meta={}){return new Promise((resolve,reject)=>{
 const reader=new FileReader();
 reader.onload=()=>{
  const im=new Image();
  im.onload=()=>{
   try{
    const max=meta.maxDim||1600,scale=Math.min(1,max/Math.max(im.width,im.height));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));
    const ctx=c.getContext('2d');ctx.drawImage(im,0,0,c.width,c.height);
    const wm=buildWatermarkMeta(meta),lines=[wm.line1,wm.line2,wm.line3].filter(Boolean);
    const base=Math.max(14,Math.round(c.width*0.018));
    const lineH=Math.round(base*1.35),pad=Math.round(base*.75),margin=Math.round(base*.7);
    ctx.font=`700 ${base}px DM Sans, Arial, sans-serif`;
    const widest=Math.max(...lines.map(line=>ctx.measureText(line).width),0);
    const boxW=Math.min(c.width-margin*2,Math.round(widest+pad*2));
    const boxH=Math.round(lines.length*lineH+pad*2);
    const x=margin,y=c.height-boxH-margin;
    ctx.fillStyle='rgba(10,20,36,.72)';ctx.fillRect(x,y,boxW,boxH);
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,boxW-1,boxH-1);
    ctx.fillStyle='#ffffff';
    lines.forEach((line,i)=>{ctx.fillText(line,x+pad,y+pad+base+i*lineH)});
    c.toBlob(blob=>{
      if(!blob){reject(new Error('Gagal membuat watermark foto.'));return}
      resolve({blob,dataUrl:c.toDataURL('image/jpeg',0.82),mimeType:'image/jpeg',fileName:(file.name||'foto').replace(/\.[a-zA-Z0-9]+$/,'')+'-wm.jpg',watermark:wm});
    },'image/jpeg',0.82);
   }catch(err){reject(err)}
  };
  im.onerror=()=>reject(new Error('Foto tidak bisa dibaca untuk diberi timestamp.'));
  im.src=reader.result;
 };
 reader.onerror=()=>reject(new Error('Foto gagal dibaca.'));
 reader.readAsDataURL(file);
})}
function compressedImage(file,meta={}){return watermarkedImage(file,meta).then(x=>x.dataUrl)}

// TaskMate v7: foto bukti melalui getUserMedia, BUKAN galeri / input type=file.
// Tetap tidak dapat memberikan bukti kriptografis bahwa kamera fisik tidak disimulasikan.
let activeCamera=null;
function stopCameraStream(){
 if(activeCamera?.stream){activeCamera.stream.getTracks().forEach(t=>t.stop());activeCamera.stream=null}
}
function closeCamera(){
 stopCameraStream();if(activeCamera?.imageUrl)URL.revokeObjectURL(activeCamera.imageUrl);
 document.getElementById('taskmate-camera-layer')?.remove();
 activeCamera=null;document.body.classList.remove('tmcam-open');
}
function cameraText(kind,id){
 if(kind==='rack'){const r=state.rackAssignments.find(x=>x.id===id);return `Sisir harga • Rak ${r?.rack_name||''}`}
 if(kind==='map')return `Map Do It • ${memberName(id)}`;
 if(kind==='shift')return `Shift ${state.shiftNumber} • ${shiftItemTitle(id)}`;
 const task=state.tasks.find(t=>t.id===id);return `Tugas • ${task?.title||''}`;
}
function cameraError(message){
 const e=document.getElementById('tmcam-error');
 if(e){e.textContent=message;e.hidden=false}
}
function validateCameraTarget(kind,id){
 if(!['rack','map','shift','task'].includes(kind)||!id)throw new Error('Item pekerjaan tidak dikenali.');
 if(kind==='task'){
  if(!state.tasks.some(t=>t.id===id))throw new Error('Tugas tidak ditemukan');return;
 }
 if(!shiftCanCheck())throw new Error('Anda tidak memiliki izin untuk mengunggah bukti shift ini.');
 if(kind==='rack'){
  const r=state.rackAssignments.find(x=>x.id===id&&x.is_active!==false);
  if(!r||!shiftScheduled().some(x=>x.user_id===r.user_id))throw new Error('Rak ini tidak terjadwal pada shift.');
  if(state.mode==='cloud'&&!isAdmin()&&state.user?.id!==r.user_id)throw new Error('Hanya PIC yang boleh memfoto rak.');
 }
 if(kind==='map'){
  if(!shiftScheduled().some(x=>x.user_id===id))throw new Error('Petugas tidak terjadwal pada shift.');
  if(state.mode==='cloud'&&!isAdmin()&&state.user?.id!==id)throw new Error('Hanya petugas bersangkutan yang boleh memfoto.');
  const note=document.querySelector(`[data-map-note="${id}"]`)?.value.trim();
  if(!note||note.length<2)throw new Error('Isi rak yang dikerjakan sebelum membuka kamera.');
 }
 if(kind==='shift'&&!shiftItemsFor(state.shiftNumber).some(x=>x[0]===id))throw new Error('Pekerjaan tidak termasuk dalam shift.');
}
async function openCamera(kind,id){
 validateCameraTarget(kind,id);
 if(activeCamera)closeCamera();
 const chosenShift=state.shiftNumber,chosenDate=cleanShiftDate();
 activeCamera={kind,id,shift:chosenShift,workDate:chosenDate,stream:null,photo:null,capturedAt:null,crop:null,imageUrl:null,busy:false};
 document.body.classList.add('tmcam-open');
 const overlay=document.createElement('section');overlay.id='taskmate-camera-layer';overlay.className='tmcam-layer';
 overlay.innerHTML=`<div class="tmcam-dialog" role="dialog" aria-modal="true" aria-label="Ambil bukti foto">
  <div class="tmcam-top"><div><b>📷 Kamera bukti wajib</b><p>${esc(cameraText(kind,id))}</p></div><button type="button" class="tmcam-close" data-cam="close" aria-label="Tutup">✕</button></div>
  <div class="tmcam-body"><div id="tmcam-video-box" class="tmcam-media"><video id="tmcam-video" autoplay playsinline muted></video></div>
   <div id="tmcam-preview-box" class="tmcam-media" hidden><img id="tmcam-preview" alt="Foto bukti sebelum dikirim"></div>
   <div id="tmcam-crop-box" class="tmcam-media" hidden><canvas id="tmcam-crop" aria-label="Geser dan atur batas rak pada foto"></canvas></div>
   <div id="tmcam-error" class="tmcam-error" hidden></div>
   <p class="tmcam-help" id="tmcam-help">Izinkan akses kamera. Galeri dinonaktifkan; waktu bukti dicatat saat kamera digunakan.</p></div>
  <div class="tmcam-actions"><button class="btn outline" type="button" data-cam="close">Batal</button><button class="btn soft" type="button" data-cam="again" hidden>↻ Ambil ulang</button><button class="btn primary" type="button" data-cam="snap" disabled>📸 Ambil foto</button><button class="btn primary" type="button" data-cam="send" hidden>✓ Simpan bukti</button></div></div>`;
 document.body.append(overlay);
 overlay.addEventListener('click',async e=>{
  const button=e.target.closest('button[data-cam]');if(!button||!activeCamera?.kind)return;
  try{
   const action=button.dataset.cam;
   if(action==='close')closeCamera();
   else if(action==='snap')await snapshotCamera();
   else if(action==='again')await resetCamera();
   else if(action==='send')await submitCameraProof();
  }catch(err){cameraError(errMessage(err))}
 });
 await startCameraPreview();
}
async function startCameraPreview(){
 if(!activeCamera)return;
 const btn=document.querySelector('[data-cam="snap"]');
 if(!navigator.mediaDevices?.getUserMedia || !window.isSecureContext){
  cameraError('Kamera browser hanya aktif di HTTPS/localhost. File HTML dari folder Downloads biasanya tidak memiliki izin kamera. Buka aplikasi melalui hosting HTTPS untuk mengambil bukti.');return;
 }
 try{
  activeCamera.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
  if(!activeCamera){return}
  const video=document.getElementById('tmcam-video');
  if(!video){stopCameraStream();return}
  video.srcObject=activeCamera.stream;
  await video.play();
  if(btn)btn.disabled=false;
 }catch(err){cameraError('Kamera tidak bisa dibuka: '+errMessage(err)+'. Periksa izin kamera di browser. Tidak ada pengganti dari galeri.');stopCameraStream()}
}
function showCameraStep(step){
 const vid=document.getElementById('tmcam-video-box'),prev=document.getElementById('tmcam-preview-box'),crop=document.getElementById('tmcam-crop-box');
 if(vid)vid.hidden=step!=='live';if(prev)prev.hidden=step!=='preview';if(crop)crop.hidden=step!=='crop';
 const sn=document.querySelector('[data-cam="snap"]'),ag=document.querySelector('[data-cam="again"]'),se=document.querySelector('[data-cam="send"]');
 if(sn)sn.hidden=step!=='live';if(ag)ag.hidden=step==='live';if(se)se.hidden=step==='live';
}
async function snapshotCamera(){
 const ss=activeCamera;if(!ss?.stream||ss.busy)return;
 const video=document.getElementById('tmcam-video');
 if(!video?.videoWidth||!video.videoHeight)throw new Error('Tunggu sampai gambar kamera tampil.');
 const cv=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(video.videoWidth,video.videoHeight));
 cv.width=Math.round(video.videoWidth*scale);cv.height=Math.round(video.videoHeight*scale);
 cv.getContext('2d').drawImage(video,0,0,cv.width,cv.height);
 const capturedAt=new Date();
 const blob=await new Promise((resolve,reject)=>cv.toBlob(x=>x?resolve(x):reject(Error('Tidak dapat mengambil foto')),'image/jpeg',.90));
 ss.photo=new File([blob],`kamera-${capturedAt.getTime()}.jpg`,{type:'image/jpeg',lastModified:capturedAt.getTime()});
 ss.capturedAt=capturedAt;
 stopCameraStream();
 ss.imageUrl=URL.createObjectURL(blob);
 document.getElementById('tmcam-preview').src=ss.imageUrl;
 document.getElementById('tmcam-error').hidden=true;
 if(ss.kind==='rack'){
  showCameraStep('crop');
  document.getElementById('tmcam-help').textContent='Geser sisi atau sudut kotak untuk memilih rak utama. Keluarkan kardus di samping dan produk gantung dari area AI.';
  await initializeCropCanvas();
 }else{
  showCameraStep('preview');
  document.getElementById('tmcam-help').textContent='Periksa hasil foto. Watermark otomatis ditambahkan dengan tanggal/jam pengambilan, nama petugas, dan item pekerjaan.';
 }
}
async function initializeCropCanvas(){
 const ss=activeCamera;
 const img=new Image();img.src=ss.imageUrl;await img.decode();
 if(!activeCamera||activeCamera!==ss)return;
 const canvas=document.getElementById('tmcam-crop');
 const scale=Math.min(1,880/img.naturalWidth);canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
 const w=canvas.width,h=canvas.height;
 ss.crop={img,canvas,rect:{x:Math.round(w*.065),y:Math.round(h*.07),w:Math.round(w*.87),h:Math.round(h*.85)},drag:null};
 redrawCrop();
 canvas.addEventListener('pointerdown',e=>{
  const sc=ss.crop;if(!sc)return;
  const b=canvas.getBoundingClientRect(),p={x:(e.clientX-b.left)*canvas.width/b.width,y:(e.clientY-b.top)*canvas.height/b.height};
  const r=sc.rect,tolerance=Math.max(16,canvas.width*.032);
  const coords=[{x:r.x,y:r.y,id:'tl'},{x:r.x+r.w,y:r.y,id:'tr'},{x:r.x,y:r.y+r.h,id:'bl'},{x:r.x+r.w,y:r.y+r.h,id:'br'}];
  const hit=coords.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<tolerance);
  sc.drag={type:hit?.id||(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h?'move':'new'),origin:p,original:{...r}};
  canvas.setPointerCapture(e.pointerId);e.preventDefault();
 });
 canvas.addEventListener('pointermove',e=>{
  const sc=ss.crop;if(!sc?.drag)return;
  const b=canvas.getBoundingClientRect(),p={x:(e.clientX-b.left)*canvas.width/b.width,y:(e.clientY-b.top)*canvas.height/b.height};
  const {type,origin,original:o}=sc.drag,dx=p.x-origin.x,dy=p.y-origin.y,min=Math.min(75,canvas.width*.16);
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(x,hi));let x=o.x,y=o.y,w=o.w,h=o.h;
  if(type==='move'){x=clamp(o.x+dx,0,canvas.width-o.w);y=clamp(o.y+dy,0,canvas.height-o.h)}
  else if(type==='new'){x=clamp(Math.min(origin.x,p.x),0,canvas.width-min);y=clamp(Math.min(origin.y,p.y),0,canvas.height-min);w=clamp(Math.abs(p.x-origin.x),min,canvas.width-x);h=clamp(Math.abs(p.y-origin.y),min,canvas.height-y)}
  else{
   if(type.includes('l')){x=clamp(o.x+dx,0,o.x+o.w-min);w=o.w-(x-o.x)}
   if(type.includes('r')){w=clamp(o.w+dx,min,canvas.width-o.x)}
   if(type.includes('t')){y=clamp(o.y+dy,0,o.y+o.h-min);h=o.h-(y-o.y)}
   if(type.includes('b')){h=clamp(o.h+dy,min,canvas.height-o.y)}
  }
  sc.rect={x,y,w,h};redrawCrop();e.preventDefault();
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{if(ss.crop)ss.crop.drag=null});
}
function redrawCrop(){
 const sc=activeCamera?.crop;if(!sc)return;
 const {canvas,img,rect:r}=sc,ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 ctx.fillStyle='rgba(7,16,29,.50)';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.drawImage(img,0,0,canvas.width,canvas.height);ctx.restore();
 ctx.strokeStyle='#38f1a9';ctx.lineWidth=Math.max(2,canvas.width/250);ctx.strokeRect(r.x,r.y,r.w,r.h);
 for(const [x,y] of [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]]){ctx.fillStyle='#38f1a9';ctx.fillRect(x-6,y-6,12,12)}
}
async function cameraCroppedFile(){
 const ss=activeCamera;if(!ss?.crop)return ss?.photo;
 const {img,canvas,rect:r}=ss.crop;
 const fx=img.naturalWidth/canvas.width,fy=img.naturalHeight/canvas.height;
 const out=document.createElement('canvas');out.width=Math.round(r.w*fx);out.height=Math.round(r.h*fy);
 if(out.width<300||out.height<200)throw new Error('Area rak terlalu kecil. Perbesar area crop.');
 out.getContext('2d').drawImage(img,Math.round(r.x*fx),Math.round(r.y*fy),out.width,out.height,0,0,out.width,out.height);
 const blob=await new Promise((resolve,reject)=>out.toBlob(x=>x?resolve(x):reject(Error('Crop foto gagal')),'image/jpeg',.90));
 return new File([blob],`crop-rak-${ss.capturedAt.getTime()}.jpg`,{type:'image/jpeg',lastModified:ss.capturedAt.getTime()});
}
async function resetCamera(){
 if(!activeCamera)return;
 if(activeCamera.imageUrl)URL.revokeObjectURL(activeCamera.imageUrl);
 activeCamera.imageUrl=null;activeCamera.photo=null;activeCamera.crop=null;activeCamera.capturedAt=null;
 showCameraStep('live');const snap=document.querySelector('[data-cam="snap"]');if(snap)snap.disabled=true;
 document.getElementById('tmcam-help').textContent='Izinkan kamera, lalu ambil foto baru.';
 await startCameraPreview();
}
async function submitCameraProof(){
 const ss=activeCamera;if(!ss?.photo||!ss.capturedAt||ss.busy)return;
 if(ss.shift!==state.shiftNumber||ss.workDate!==cleanShiftDate())throw new Error('Jadwal berubah. Ambil ulang foto.');
 ss.busy=true;const btn=document.querySelector('[data-cam="send"]');if(btn){btn.disabled=true;btn.textContent='Mengunggah…'}
 try{
  const f=ss.kind==='rack'?await cameraCroppedFile():ss.photo;
  if(ss.kind==='rack')await uploadRackPhoto(ss.id,[f],ss.capturedAt);
  if(ss.kind==='map')await uploadMapPhoto(ss.id,[f],ss.capturedAt);
  if(ss.kind==='shift')await uploadShiftProof(ss.id,[f],ss.capturedAt);
  if(ss.kind==='task')await uploadProof([f],ss.id,ss.capturedAt);
  closeCamera();
 }catch(error){ss.busy=false;if(btn){btn.disabled=false;btn.textContent='✓ Simpan bukti'}throw error}
}

async function uploadProof(files,tid,capturedAt=null){
 if([...files].some(f=>f.type.startsWith('image/'))&&!(capturedAt instanceof Date))throw new Error('Foto bukti wajib dari kamera aplikasi.');
 const valid=['image/jpeg','image/png','image/webp','image/heic','application/pdf'];let added=0;
 const task=state.tasks.find(x=>x.id===tid);
 for(const file of [...files]){
  if(!valid.includes(file.type)){notify('Gunakan JPG, PNG, WebP, HEIC, atau PDF',true);continue}
  if(file.size>10*1024*1024){notify(`File ${file.name} lebih dari 10 MB`,true);continue}
  const isImage=file.type.startsWith('image/')&&file.type!=='image/heic';
  const meta={userName:currentUserName(),itemLabel:task?.title||'Bukti tugas',areaLabel:task?.category||'Tugas',now:capturedAt||new Date()};
  if(state.mode==='demo'){
   if(!isImage){notify('Demo mendukung foto JPG/PNG/WebP saja; hubungkan cloud untuk PDF.',true);continue}
   const stamped=await watermarkedImage(file,meta);
   state.evidence.push({id:uid(),task_id:tid,uploaded_by:state.user.id,file_name:stamped.fileName,mime_type:'image/jpeg',object_path:'',data_url:stamped.dataUrl,client_captured_at:capturedAt.toISOString(),created_at:new Date().toISOString()});added++;
  }else{
   const payload=isImage?await watermarkedImage(file,meta):{blob:file,mimeType:file.type,fileName:file.name};
   const original=(payload.fileName||file.name).replace(/[^a-zA-Z0-9.\-_]/g,'_').slice(-90),path=`${state.workspace.id}/${tid}/${uid()}-${original}`;
   const upload=await state.db.storage.from('task-evidence').upload(path,payload.blob,{contentType:payload.mimeType,upsert:false});if(upload.error)throw upload.error;
   const {error}=await state.db.from('task_evidence').insert({task_id:tid,uploaded_by:state.user.id,object_path:path,file_name:payload.fileName||file.name,mime_type:payload.mimeType||file.type,client_captured_at:isImage?capturedAt.toISOString():null});
   if(error){await state.db.storage.from('task-evidence').remove([path]);throw error}added++;
  }
 }
 if(added){await afterMutation();notify(`${added} bukti berhasil diunggah${files.length?' dengan timestamp':''}`)}
}
async function openProof(id){const proof=state.evidence.find(x=>x.id===id);if(!proof)return;
 if(state.mode==='demo'){if(proof.data_url)window.open(proof.data_url,'_blank');return}
 const tab=window.open('about:blank','_blank');
 const {data,error}=await state.db.storage.from('task-evidence').createSignedUrl(proof.object_path,120);
 if(error){tab?.close();throw error}
 if(tab)tab.location.href=data.signedUrl;else{const a=document.createElement('a');a.href=data.signedUrl;a.target='_blank';a.rel='noopener';a.click()}
}
function reportText(){const arr=reportItems();return `LAPORAN PEKERJAAN • ${state.workspace.name}\nPeriode: ${state.reportRange==='today'?'Hari ini':state.reportRange==='week'?'7 hari terakhir':'30 hari terakhir'}\nTanggal rekap: ${dayLabel()}\nTotal: ${arr.length} | Selesai: ${arr.filter(x=>x.status==='done').length} | Terlambat: ${arr.filter(overdue).length}\n\n`+arr.map((t,i)=>`${i+1}. ${t.title}\n   PJ: ${memberName(t.assignee_id)}\n   Deadline: ${niceTime(t.due_at)}\n   Checklist: ${taskChecks(t.id).filter(c=>c.is_checked).length}/${taskChecks(t.id).length} | Bukti: ${taskProofs(t.id).length} | ${statusNames[t.status]}`).join('\n\n')}
function exportCSV(){const arr=reportItems();const rows=[['Tugas','Penanggung Jawab','Prioritas','Status','Deadline','Checklist Selesai','Total Checklist','Jumlah Bukti','Dibuat','Diselesaikan'],...arr.map(t=>[t.title,memberName(t.assignee_id),priorityNames[t.priority],statusNames[t.status],niceTime(t.due_at),taskChecks(t.id).filter(x=>x.is_checked).length,taskChecks(t.id).length,taskProofs(t.id).length,niceTime(t.created_at),niceTime(t.completed_at)])];
 const csv='\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`TaskMate-Laporan-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);notify('Laporan CSV diunduh')}
async function copyText(text){if(navigator.clipboard&&location.protocol==='https:'){await navigator.clipboard.writeText(text)}else{const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.opacity='0';document.body.appendChild(el);el.select();document.execCommand('copy');el.remove()}notify('Berhasil disalin')}
function checkReminders(){
 if(typeof Notification==='undefined'||Notification.permission!=='granted'||document.hidden)return;
 const now=Date.now();state.tasks.filter(t=>t.status!=='done'&&(t.assignee_id===state.user?.id||t.assignee_id===null)&&t.due_at).forEach(t=>{
  const delta=date(t.due_at).getTime()-now;if(delta>30*60000||delta< -10*60000)return;
  const key=`taskmate-notified-${t.id}-${t.due_at}`;if(sessionStorage.getItem(key))return;
  try{new Notification('⏰ Deadline TaskMate',{body:`${t.title} • ${delta<0?'Sudah melewati batas waktu':`Sisa ${Math.max(1,Math.ceil(delta/60000))} menit`}`,icon:'./icons/icon-192.png',tag:key});sessionStorage.setItem(key,'yes')}catch{}
 });
}
function formBusy(form,busy){const b=$('[type="submit"]',form);if(b){b.disabled=busy;b.textContent=busy?'Memproses…':b.dataset.original||b.textContent;if(busy&&!b.dataset.original)b.dataset.original='Simpan'}}
// Event delegation menjadikan layar responsif meskipun tiap halaman dirender ulang.
document.addEventListener('click',async e=>{
 const target=e.target.closest('[data-action]');if(!target)return;
 const a=target.dataset.action,id=target.dataset.id;
 try{
 if(a==='personal-theme'){
  const choice=String(target.dataset.theme||'');
  if(!PERSONAL_THEMES.some(t=>t.id===choice))throw new Error('Tema tidak tersedia');
  try{localStorage.setItem(personalThemeKey(),choice)}catch{throw new Error('Penyimpanan tema pada HP ini tidak tersedia')}
  applyPersonalTheme();render();notify('Tema '+PERSONAL_THEMES.find(t=>t.id===choice).name+' aktif di akun ini');
 }
 else if(a==='personal-shape'){
  const shape=String(target.dataset.shape||'');
  if(shape!=='neo'&&shape!=='soft')throw new Error('Bentuk kartu tidak dikenal');
  try{localStorage.setItem(personalShapeKey(),shape)}catch{throw new Error('Tidak dapat menyimpan bentuk kartu di perangkat ini')}
  applyPersonalTheme();render();notify(shape==='neo'?'Bentuk Folder 3D aktif':'Bentuk kartu halus aktif');
 }
 else if(a==='tab'){state.tab=target.dataset.tab;state.modal=null;state.search='';render();window.scrollTo(0,0);if(state.tab==='reports'&&isAdmin()&&state.mode==='cloud'&&!state.photoReportLoaded&&!state.photoReportBusy)await loadPhotoReport()}
 else if(a==='filter'){state.filter=target.dataset.filter;render()}
 else if(a==='report-range'){state.reportRange=target.dataset.value;render()}
 else if(a==='camera-open'){await openCamera(target.dataset.kind,id)}
 else if(a==='new-task'){modal('task')}
 else if(a==='detail'){modal('detail',id)}
 else if(a==='edit-task'){modal('task',id)}
 else if(a==='close-modal'){closeModal()}
 else if(a==='close-overlay'&&e.target===target){closeModal()}
 else if(a==='open-config'){modal('config')}
 else if(a==='open-workspace'){modal('workspace')}
 else if(a==='refresh-requests'){await loadAll();notify('Status permintaan sudah diperbarui')}
 else if(a==='approve-link-open'){modal('approve-link',id)}
 else if(a==='approve-without-link'){state.modal=null;await manageMember(id,'approve')}
 else if(a==='manage-member'){await manageMember(id,target.dataset.memberAction)}
 else if(a==='status'){await updateStatus(id,target.dataset.status)}
 else if(a==='delete-check'){await deleteCheck(id)}
 else if(a==='delete-task'){await deleteTask(id)}
 else if(a==='open-proof'){await openProof(id)}
 else if(a==='copy-code'){await copyText(state.workspace.invite_code)}
 else if(a==='copy-report'){await copyText(reportText())}
 else if(a==='export-csv'){exportCSV()}
 else if(a==='photo-report-load'){await loadPhotoReport()}
 else if(a==='photo-report-open'){await openPhotoReportFile(id)}
 else if(a==='photo-report-pdf'){await exportPhotoReportPdf()}
 else if(a==='auth-tab'){state.authTab=target.dataset.tab;render()}
 else if(a==='forgot-pass'){if(state.mode!=='cloud')return;const email=prompt('Masukkan email untuk tautan reset password:');if(email){const {error}=await state.db.auth.resetPasswordForEmail(email.trim());if(error)throw error;notify('Jika email terdaftar, tautan reset akan dikirim.')}}
 else if(a==='demo-mode'){state.mode='demo';state.user={id:'demo-me'};state.notice='';setDemo();render()}
 else if(a==='tm-schedule-delete-one'){
  const f=document.getElementById('tm-schedule-form');if(!f)return;
  await editImportedSchedule(f.elements.staff_key.value,f.elements.day.value,null);
 }
 else if(a==='sync'){await syncNow()}
 else if(a==='shift-today'){state.shiftDate=localDay();state.shiftView='mine';await loadShiftCloud();render()}
 else if(a==='shift-select'||a==='shift-go'){state.shiftNumber=Number(target.dataset.shift);state.tab='shift';state.shiftFilter='all';state.shiftView='mine';
 if(state.shiftNumber===3){const t=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));if(t.getHours()<7&&state.shiftDate===localDay()){t.setDate(t.getDate()-1);state.shiftDate=localDay(t);await loadShiftCloud()}}render();window.scrollTo(0,0)}
 else if(a==='shift-filter'){state.shiftFilter=target.dataset.filter;render()}
 else if(a==='shift-view'){const view=target.dataset.view;if(view!=='mine'&&view!=='team')throw new Error('Tampilan tidak tersedia');if(view==='team'&&!canMonitorShift())throw new Error('Hanya Admin Tim atau Admin Shift dapat memantau semua tugas');state.shiftView=view;state.shiftFilter='all';render();}
 else if(a==='shift-assignment-toggle'){
  const shift=Number(target.dataset.shift)||state.shiftNumber;
  const panelKey=`${cleanShiftDate()}:${shift}`;
  const open=!state.assignmentPanelsOpen[panelKey];
  state.assignmentPanelsOpen[panelKey]=open;
  const panel=target.closest('.tm-shift-assignment');
  const body=panel?.querySelector('.tm-shift-assignment-body');
  if(body)body.hidden=!open;
  if(panel)panel.dataset.expanded=String(open);
  target.setAttribute('aria-expanded',String(open));
  const pill=target.querySelector('.tm-shift-assignment-pill');
  if(pill)pill.innerHTML=`${open?'Tutup':'Buka'} <span aria-hidden="true" class="tm-shift-assignment-chevron">▾</span>`;
 }
 else if(a==='shift-point-toggle'){state.showTaskManager=!state.showTaskManager;render()}
 else if(a==='shift-point-add'){modal('shift-point')}
 else if(a==='shift-point-edit'){modal('shift-point',id)}
 else if(a==='shift-point-archive'){await changeShiftPointState(id,false)}
 else if(a==='shift-point-restore'){await changeShiftPointState(id,true)}
 else if(a==='shift-export-all'){exportShiftCSV(true)}
 else if(a==='v4-sync-import'){await syncImported()}
 else if(a==='shift-rack-add-toggle'){state.showRackForm=!state.showRackForm;render()}
 else if(a==='shift-rack-deactivate'){await deactivateRack(id)}
 else if(a==='shift-prev'||a==='shift-next'){const d=new Date(state.shiftDate+'T12:00:00');d.setDate(d.getDate()+(a==='shift-next'?1:-1));state.shiftDate=localDay(d);state.shiftView='mine';await loadShiftCloud();render()}
 else if(a==='shift-open-proof'){await openShiftProof(id)}
 else if(a==='extra-open'){await openExtraProof(target.dataset.kind,id)}
 else if(a==='shift-remove-roster'){await removeShiftRoster(id)}
 else if(a==='enable-push'){await enableShiftPush()}
 else if(a==='shift-test-alarm'){await testAlarm()}
 else if(a==='shift-export'){exportShiftCSV()}
 else if(a==='shift-save-note'){await saveShiftNote(id,document.querySelector(`[data-shift-note="${id}"]`)?.value)}
 else if(a==='notifications'){if(typeof Notification==='undefined'){notify('Browser ini tidak mendukung notifikasi.',true);return}const p=await Notification.requestPermission();notify(p==='granted'?'Pengingat browser aktif ketika aplikasi terbuka':'Izin notifikasi belum diberikan',p!=='granted');checkReminders()}
 else if(a==='logout'){if(!confirm('Keluar dari akun TaskMate?'))return;unsubscribe();const {error}=await state.db.auth.signOut();if(error)throw error;state.user=null;state.workspace=null;state.modal=null;render()}
 else if(a==='disconnect-cloud'){if(!confirm('Lepas koneksi Supabase pada HP ini? Data online tidak akan terhapus.'))return;unsubscribe();await state.db.auth.signOut().catch(()=>{});localStorage.removeItem('taskmate-cloud-config');if(window.TASKMATE_CONFIG?.supabaseUrl){notify('Konfigurasi ditetapkan di config.js. Ubah file di hosting untuk memutus koneksi.',true);return}location.reload()}
 else if(a==='reset-demo'){if(confirm('Hapus seluruh data demo pada perangkat ini?')){localStorage.removeItem('taskmate-demo-v1');localStorage.removeItem(shiftCacheKey());setDemo();render();notify('Demo direset')}}
 else if(a==='switch-workspace'){localStorage.setItem('taskmate-current-workspace',id);state.modal=null;await loadAll()}
 }catch(err){showError(err)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal)closeModal();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-action="detail"],[data-action="open-proof"]')){e.preventDefault();e.target.click()}});
document.addEventListener('input',e=>{if(e.target.id==='task-search'){const pos=e.target.selectionStart;state.search=e.target.value;const matching=state.tasks.filter(t=>(state.filter==='all'||(state.filter==='mine'?t.assignee_id===state.user.id:state.filter==='late'?overdue(t):t.status===state.filter))&&(state.priority==='all'||t.priority===state.priority)&&(!state.search||(`${t.title} ${t.description} ${memberName(t.assignee_id)}`).toLowerCase().includes(state.search.toLowerCase())));$('#task-list').innerHTML=matching.length?matching.map(taskCard).join(''):empty('🔎','Tugas tidak ditemukan','Coba kata kunci lain.');}});
document.addEventListener('change',async e=>{
 try{
 if(e.target.id==='private-roster-import'){await importPrivateRoster(e.target.files?.[0]);e.target.value='';}
 else if(e.target.id==='shift-excel-import'||e.target.id==='rack-excel-import'){const file=e.target.files?.[0];e.target.value='';await importExcelStaff(file);}
 else if(e.target.dataset.action==='shift-admin-select'){const id=e.target.value;if(id)await setShiftAdmin(id,Number(e.target.dataset.shift));else{notify('Pilih satu Admin Shift terjadwal',true);render()}}
 else if(e.target.dataset.action==='shift-pic-select'){await setShiftPic(e.target.dataset.item,e.target.value,Number(e.target.dataset.shift))}
 else if(e.target.id==='tm-schedule-staff'||e.target.id==='tm-schedule-date'){refreshScheduleEditorHint()}
 else if(e.target.id==='priority-filter'){state.priority=e.target.value;render()}
 else if(e.target.dataset.action==='toggle-check'){await toggleCheck(e.target.dataset.id,e.target.checked)}
 else if(e.target.dataset.action==='shift-check'){await toggleShiftCheck(e.target.dataset.id,e.target.checked)}
 else if(e.target.dataset.action==='shift-rack-check'){await toggleRackCheck(e.target.dataset.id,e.target.checked)}
 else if(e.target.id==='shift-date'){state.shiftDate=e.target.value||localDay();state.shiftView='mine';await loadShiftCloud();render()}
 else if(e.target.id==='photo-report-date'){state.photoReportDate=e.target.value||localDay();state.photoReportItems=[];state.photoReportLoaded=false;await loadPhotoReport()}
 else if(e.target.id==='photo-report-shift'){const y=window.scrollY;state.photoReportShift=e.target.value;render();window.scrollTo(0,y)}
 else if(e.target.id==='photo-report-pic'){const y=window.scrollY;state.photoReportPic=e.target.value;render();window.scrollTo(0,y)}
 else if(e.target.dataset.action==='upload-proof'){const files=e.target.files,tid=e.target.dataset.task;if(files?.length){notify('Mengunggah bukti pekerjaan…');await uploadProof(files,tid)}}
 }catch(err){showError(err);render()}
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!['auth-form','create-workspace','join-workspace','task-form','add-check','config-form','shift-roster-form','rack-assign-form','staff-link-form','approve-link-form','shift-point-form','tm-schedule-form','tm-schedule-bulk-form'].includes(form.id))return;
 e.preventDefault();if(state.busy)return;state.busy=true;const button=form.querySelector('button[type=submit]'),orig=button?.textContent;if(button){button.disabled=true;button.textContent='Memproses…'}
 try{
 if(form.id==='auth-form'){
  const fd=new FormData(form),email=String(fd.get('email')).trim(),password=String(fd.get('password'));
  if(state.authTab==='signup'){
   const {data,error}=await state.db.auth.signUp({email,password,options:{data:{full_name:String(fd.get('full_name')||'').trim()}}});if(error)throw error;
   if(!data.session){notify('Akun dibuat. Cek email untuk verifikasi, lalu login.');state.authTab='login';render()}
   else{state.user=data.session.user;await loadAll();notify('Akun berhasil dibuat')}
  }else{const {data,error}=await state.db.auth.signInWithPassword({email,password});if(error)throw error;state.user=data.user;await loadAll();notify('Berhasil masuk')}
 }
 else if(form.id==='create-workspace'){
  const name=String(new FormData(form).get('name')).trim();const {data,error}=await state.db.rpc('create_workspace',{p_name:name});if(error)throw error;
  localStorage.setItem('taskmate-current-workspace',data);state.modal=null;await loadAll();notify('Tim baru berhasil dibuat')
 }
 else if(form.id==='join-workspace'){
  const code=String(new FormData(form).get('code')).trim();const {data,error}=await state.db.rpc('join_workspace',{p_code:code});if(error)throw error;
  state.modal=null;await loadAll();notify('Permintaan terkirim. Tunggu persetujuan admin tim.')
 }
 else if(form.id==='tm-schedule-form'){
  const d=new FormData(form);await editImportedSchedule(String(d.get('staff_key')||''),String(d.get('day')||''),String(d.get('code')||''));
 }
 else if(form.id==='tm-schedule-bulk-form'){await deleteImportedRange(form)}
 else if(form.id==='shift-roster-form')await saveShiftRoster(form);
 else if(form.id==='rack-assign-form')await saveRackAssignment(form);
 else if(form.id==='staff-link-form')await saveStaffLink(form);
 else if(form.id==='approve-link-form')await approveLink(form);
 else if(form.id==='shift-point-form')await saveShiftPoint(form);
 else if(form.id==='task-form')await saveTask(form);
 else if(form.id==='add-check')await addCheck(form);
 else if(form.id==='config-form'){
  const fd=new FormData(form),url=String(fd.get('url')).trim().replace(/\/$/,''),key=String(fd.get('key')).trim();
  if(!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(url)){notify('Gunakan Project URL: https://xxxx.supabase.co',true);return}
  if(key.length<15||/service_role|sb_secret_/.test(key)){notify('Gunakan publishable key / anon key, bukan secret key.',true);return}
  localStorage.setItem('taskmate-cloud-config',JSON.stringify({url,key}));location.reload();
 }
 }catch(err){showError(err)}finally{state.busy=false;if(button?.isConnected){button.disabled=false;button.textContent=orig}}
});

// v8: pengelolaan poin shift dengan histori perubahan berdasarkan tanggal efektif.
const protectedShiftPoints=new Set(['sisir-harga','map-do-it']);
function shiftPointByKey(key,s=state.shiftNumber,day=localDay()){
 const base=(shiftCatalog[s]||[]).flatMap(a=>a.items.map(i=>({item_key:i[0],title:i[1],details:i[2],area_name:a.name,photo_required:i[0]==='foto-selisih',is_active:true,is_default:true})));
 const result=base.find(x=>x.item_key===key)||null;
 const v=effectiveShiftVersion(key,s,day);
 return v?{...v,is_default:!!result}:result;
}
function shiftPointForm(key=null){
 if(!isAdmin())return '';
 const s=state.shiftNumber,current=key?shiftPointByKey(key,s,localDay()):null;
 const areas=[...new Set([...(shiftCatalog[s]||[]).map(a=>a.name),...state.shiftTaskVersions.filter(v=>v.shift_number===s).map(v=>v.area_name)].filter(Boolean))];
 const disabled=key&&protectedShiftPoints.has(key),builtin=!!current?.is_default;
 const body=`<p class="small muted" style="margin-bottom:14px">Poin berlaku mulai <b>${esc(localDay())}</b> pada Shift ${s}; laporan tanggal sebelumnya tidak berubah.</p>
 <form id="shift-point-form"><input type="hidden" name="shift_number" value="${s}"><input type="hidden" name="item_key" value="${esc(key||'')}">
 <div class="form-grp"><label>Nama pekerjaan</label><input class="field" name="title" required maxlength="100" minlength="3" value="${esc(current?.title||'')}" placeholder="Misalnya: Bersihkan kaca pintu"></div>
 <div class="form-grp"><label>Area</label><input class="field" name="area_name" list="shift-areas-list" required maxlength="60" value="${esc(current?.area_name||areas[0]||'Area Sales')}" placeholder="Contoh: Area Depan"><datalist id="shift-areas-list">${areas.map(a=>`<option value="${esc(a)}"></option>`).join('')}</datalist></div>
 <div class="form-grp"><label>Petunjuk pekerjaan</label><textarea class="field" name="details" rows="3" maxlength="300" placeholder="Apa saja yang harus dikerjakan?">${esc(current?.details||'')}</textarea></div>
 <label class="checkline"><input type="checkbox" name="photo_required" ${current?.photo_required?'checked':''} ${disabled?'disabled':''}>Wajib foto kamera + timestamp sebelum bisa dicentang</label>
 ${disabled?'<p class="small muted">Poin khusus foto per rak/Map Do It mempunyai aturan bawaan dan tidak dapat diubah.</p>':''}
 <div class="shift-point-form-actions"><button class="btn primary" type="submit" ${disabled?'disabled':''}>${key?'Simpan perubahan':'Tambah pekerjaan'}</button><button class="btn outline" type="button" data-action="close-modal">Batal</button></div></form>`;
 return modalFrame(`${key?'Edit':'Tambah'} Poin Shift ${s}`,builtin?'Pekerjaan bawaan tetap mempunyai histori':'Tambahkan tugas ke area pada shift yang dipilih',body);
}
function shiftPointManager(s=state.shiftNumber){
 if(!isAdmin())return '';
 const open=state.showTaskManager;
 const now=localDay();
 const versions=state.shiftTaskVersions.filter(v=>v.shift_number===s&&v.effective_from<=now);
 const keys=[...new Set([...(shiftCatalog[s]||[]).flatMap(a=>a.items.map(i=>i[0])),...versions.map(v=>v.item_key)])];
 return `<section class="panel shift-manage-panel"><div class="shift-manage-header"><div><h3>⚙ Kelola Poin Shift ${s}</h3><p class="small muted">Admin dapat menambah, mengedit dan mengarsipkan tugas per shift.</p></div><button type="button" class="btn ${open?'soft':'outline'} sm" data-action="shift-point-toggle">${open?'Tutup':'Kelola'}</button></div>
 ${state.shiftTaskConfigError?`<div class="notice" style="margin-top:10px">⚠ ${esc(state.shiftTaskConfigError)} · Jalankan schema-shift-v8.sql di Supabase.</div>`:''}
 ${open?`<button type="button" class="btn primary sm" data-action="shift-point-add" ${state.shiftTaskConfigError?'disabled':''}>＋ Tambah pekerjaan</button>
 <div class="shift-manage-list">${keys.map(key=>{
 const p=shiftPointByKey(key,s,now);if(!p)return '';
 const active=p.is_active!==false,locked=protectedShiftPoints.has(key);
 return `<div class="shift-manage-row ${active?'':'archived'}"><div><strong>${esc(p.title)}</strong><small>${esc(p.area_name)} · ${active?'Aktif':'Diarsipkan'}${p.photo_required?' · 📷 Foto wajib':''}</small></div><div class="shift-manage-buttons">${active?`<button class="btn outline sm" data-action="shift-point-edit" data-id="${esc(key)}" ${locked||state.shiftTaskConfigError?'disabled':''}>Edit</button><button class="btn danger sm" data-action="shift-point-archive" data-id="${esc(key)}" ${locked||state.shiftTaskConfigError?'disabled':''}>Hapus</button>`:`<button class="btn soft sm" data-action="shift-point-restore" data-id="${esc(key)}" ${state.shiftTaskConfigError?'disabled':''}>Aktifkan</button>`}</div></div>`;
 }).join('')}</div>
 <p class="small muted" style="margin-top:12px">Tombol Hapus mengarsipkan poin mulai hari ini, tidak menghapus foto atau laporan lama. Sisir Harga dan Map Do It dilindungi.</p>`:''}</section>`;
}
async function saveShiftPoint(form){
 if(!isAdmin())throw Error('Hanya admin yang dapat mengubah poin shift.');
 if(state.shiftTaskConfigError)throw Error(state.shiftTaskConfigError);
 const f=new FormData(form),s=Number(f.get('shift_number')),key=String(f.get('item_key')||'')||'point-'+uid();
 const title=String(f.get('title')||'').trim(),area=String(f.get('area_name')||'').trim(),details=String(f.get('details')||'').trim();
 if(![1,2,3].includes(s)||s!==state.shiftNumber)throw Error('Shift tidak valid.');
 if(protectedShiftPoints.has(key))throw Error('Poin khusus rak dan Map Do It tidak dapat diubah.');
 if(title.length<3||title.length>100||area.length<2||area.length>60||details.length>300)throw Error('Periksa nama tugas (3–100 karakter), area (2–60), dan petunjuk (maks. 300).');
 const entry={workspace_id:state.workspace.id,shift_number:s,item_key:key,title,area_name:area,details,photo_required:f.has('photo_required')||key==='foto-selisih',is_active:true,effective_from:localDay(),created_by:state.user.id};
 await upsertShiftPointVersion(entry);
 state.modal=null;await afterShiftMutation();notify('Poin Shift '+s+' berhasil disimpan.');
}
async function changeShiftPointState(key,active){
 if(!isAdmin())throw Error('Hanya admin yang dapat mengubah poin shift.');
 if(state.shiftTaskConfigError)throw Error(state.shiftTaskConfigError);
 if(protectedShiftPoints.has(key))throw Error('Sisir Harga dan Map Do It wajib tetap aktif.');
 const p=shiftPointByKey(key,state.shiftNumber,localDay());if(!p)throw Error('Pekerjaan tidak ditemukan.');
 if(!active&&!confirm(`Hapus "${p.title}" dari checklist mulai hari ini?\nLaporan dan foto historis tetap tersimpan.`))return;
 const entry={workspace_id:state.workspace.id,shift_number:state.shiftNumber,item_key:key,title:p.title,details:p.details||'',area_name:p.area_name,photo_required:!!p.photo_required,is_active:active,effective_from:localDay(),created_by:state.user.id};
 await upsertShiftPointVersion(entry);await afterShiftMutation();notify(active?'Pekerjaan diaktifkan kembali':'Pekerjaan diarsipkan, riwayat tetap aman');
}
async function upsertShiftPointVersion(entry){
 if(state.mode==='demo'){
  state.shiftTaskVersions=state.shiftTaskVersions.filter(v=>!(v.shift_number===entry.shift_number&&v.item_key===entry.item_key&&v.effective_from===entry.effective_from));
  state.shiftTaskVersions.push({id:uid(),...entry,created_at:new Date().toISOString()});return;
 }
 const {error}=await state.db.from('shift_task_versions').upsert(entry,{onConflict:'workspace_id,shift_number,item_key,effective_from'});if(error)throw error;
}

// === MODUL CHECKLIST SHIFT 1, 2, 3 — ROSTER & RAK PER PIC ===
const shiftCatalog={
 1:[
  {name:'Awal Shift',icon:'☀',items:[['parkir','Cek area parkir','Periksa kebersihan dan kerapian area parkir.'],['teras','Area teras','Lap galon, sapu dan pel lantai teras.']]},
  {name:'Freshfood',icon:'🍎',items:[['sortir-buah','Sortir buah','Pisahkan buah yang kualitasnya tidak layak.'],['update-harga','Update harga','Periksa label price dan POP.']]},
  {name:'Kasir',icon:'▣',items:[['area-kasir','Bersihkan area kasir','Bersihkan kolong meja kasir dan atas meja komputer.']]},
  {name:'Sales',icon:'▥',items:[['sisir-harga','Sisir harga tanggung jawab rak','Cek harga rak masing-masing petugas yang masuk shift sampai 100%.'],['map-do-it','Map Do It','Selesaikan 1 rak per hari; catat rak yang dikerjakan.']]},
  {name:'Area Belakang',icon:'▤',items:[['toilet-customer','Kamar mandi customer','Ceklis equipment lalu bersihkan kamar mandi.'],['bawah-tangga','Bawah tangga','Pastikan clear dari barang.'],['wastafel','Wastafel','Pastikan clear dari barang.'],['retur','Retur barang','Letakkan barang retur di post retur.']]},
  {name:'Gudang',icon:'▧',items:[['grup-receh','Grouping barang receh','Kelompokkan dan rapikan barang receh.'],['grup-karton','Grouping kartonan','Kelompokkan kartonan.'],['label-expired','Label expired kartonan','Tempel dan cek label expired kartonan.']]}
 ],
 2:[
  {name:'Awal Shift',icon:'☀',items:[['depan-sapu-pel','Area depan','Sapu dan pel area depan toko.'],['parkir-sapu','Area parkir','Sapu seluruh area parkir.']]},
  {name:'Sales',icon:'▥',items:[['map-do-it','Map Do It','Kerjakan 1 rak setiap hari, isi rak yang dipilih.'],['sisir-harga','Sisir harga tanggung jawab rak','Setiap petugas mengecek 100% rak tanggung jawabnya.'],['full-display','Full display','Pastikan stok di rak terdisplay penuh sesuai ketentuan.'],['facing-out','Facing out','Rapikan facing produk menghadap ke depan.']]},
  {name:'Area Belakang',icon:'▤',items:[['wastafel-clear','Wastafel clear','Kosongkan dan rapikan area wastafel.'],['bawah-tangga-clear','Bawah tangga clear','Pastikan tidak ada barang di bawah tangga.'],['kamar-mandi','Bersihkan kamar mandi','Lakukan kebersihan kamar mandi.']]}
 ],
 3:[
  {name:'SO Parsial',icon:'▤',items:[['so-parsial','Stock opname parsial','Lakukan SO parsial sesuai area yang ditugaskan.'],['foto-selisih','Foto cetak selisih','Upload foto hasil cetak selisih SO parsial sebelum menandai selesai.']]},
  {name:'Sales',icon:'▥',items:[['map-do-it','Map Do It','Kerjakan 1 rak per hari; catat rak yang dikerjakan.'],['sisir-harga','Sisir harga tanggung jawab rak','Periksa 100% rak tanggung jawab setiap petugas shift ini.']]},
  {name:'General Cleaning',icon:'✦',items:[['general-cleaning','GC sesuai jadwal','Lakukan general cleaning berdasarkan jadwal; catat area yang dikerjakan.']]},
  {name:'Area Depan',icon:'☀',items:[['parkir-sapu','Sapu parkiran','Sapu seluruh area parkiran.'],['teras-sapu-pel','Sapu dan pel teras','Bersihkan teras dengan sapu dan pel.']]}
 ]
};
const shiftNumbers=[1,2,3];
let IMPORTED=window.TASKMATE_IMPORTED||{month:'2026-11',shiftCodes:{},staff:[]};
const CODE_FOR_SHIFT={1:'P7',2:'S14',3:'M22'};
const SHIFT_HOURS={1:'07.00–17.00',2:'14.00–23.00',3:'21.30–07.00 (+1 hari)'};
const staffForDay=(s,day=cleanShiftDate())=>IMPORTED.staff.filter(p=>p.schedule[day]===CODE_FOR_SHIFT[s]);
const linkedUid=p=>state.mode==='demo'?`v4-demo-${p.key}`:(state.staffLinks.find(l=>l.staff_key===p.key)?.user_id||null);
function workTime(day,code){
 const c=IMPORTED.shiftCodes[code];if(!c)return null;
 const start=new Date(`${day}T${c.start}:00+07:00`);
 const n=new Date(`${day}T12:00:00Z`);if(c.end<=c.start)n.setUTCDate(n.getUTCDate()+1);
 const endDay=n.toISOString().slice(0,10),end=new Date(`${endDay}T${c.end}:00+07:00`);
 return {start_at:start.toISOString(),end_at:end.toISOString(),shift_number:c.shift};
}
function seedDemoNovember(){
 if(state.mode!=='demo')return;
 let changed=false;
 for(const person of IMPORTED.staff){
  const id=`v4-demo-${person.key}`;
  if(!state.profiles.some(p=>p.id===id)){state.profiles.push({id,full_name:person.name});changed=true}
  if(!state.members.some(m=>m.user_id===id)){state.members.push({workspace_id:state.workspace.id,user_id:id,role:'member'});changed=true}
  for(const rack of person.racks){
   if(!state.rackAssignments.some(r=>r.user_id===id&&r.rack_name===rack&&r.is_active!==false)){
    state.rackAssignments.push({id:`v4-rack-${person.key}-${rack}`,workspace_id:state.workspace.id,user_id:id,rack_name:rack,is_active:true});changed=true;
   }
  }
  for(const [day,code] of Object.entries(person.schedule)){
   const time=workTime(day,code);if(!time)continue;
   if(!state.shiftRoster.some(r=>r.user_id===id&&r.work_date===day)){
    state.shiftRoster.push({id:`v4-roster-${person.key}-${day}`,workspace_id:state.workspace.id,user_id:id,work_date:day,...time});changed=true;
   }
  }
 }
 if(changed)persistShiftDemo();
}
function scheduleManagerPanel(){
 if(!isAdmin()||state.mode!=='cloud'||!IMPORTED.staff.length)return '';
 const day=cleanShiftDate(),today=localDay(),canEdit=day>=today;
 const first=IMPORTED.staff[0];
 const options=IMPORTED.staff.map(p=>`<option value="${esc(p.key)}">${esc(p.name)}</option>`).join('');
 const codeOpts=[['P7','Shift 1 · 07.00–17.00'],['S14','Shift 2 · 14.00–23.00'],['M22','Shift 3 · 21.30–07.00'],['O','Libur'],['AO','Libur AO'],['MT','MT'],['C','Cuti']];
 return `<details class="tm-schedule-admin" id="tm-schedule-admin">
 <summary>🗓️ Kelola jadwal impor <span>Admin · edit / hapus</span></summary>
 <div class="tm-schedule-content">
  <p class="small muted">Ubah jadwal resmi Excel dan roster cloud sekaligus. Data historis terkunci dan jadwal dengan bukti foto tidak bisa dihapus.</p>
  <form id="tm-schedule-form" class="tm-schedule-form">
   <label>Nama karyawan dari Excel<select class="field" name="staff_key" id="tm-schedule-staff" required>${options}</select></label>
   <label>Tanggal kerja<input class="field" type="date" name="day" id="tm-schedule-date" min="${today}" value="${day>=today?day:today}" required></label>
   <label>Kode / shift baru<select class="field" name="code" id="tm-schedule-code">${codeOpts.map(([code,label])=>`<option value="${code}" ${first.schedule?.[day>=today?day:today]===code?'selected':''}>${esc(label)}</option>`).join('')}</select></label>
   <div class="tm-schedule-current" id="tm-schedule-current">Jadwal saat ini: ${esc(first.schedule?.[day>=today?day:today]||'Belum ada')}</div>
   <div class="tm-schedule-actions"><button class="btn primary sm" type="submit">✓ Simpan perubahan</button><button class="btn danger sm" data-action="tm-schedule-delete-one" type="button">Hapus tanggal ini</button></div>
  </form>
  <details class="tm-schedule-range"><summary>Hapus beberapa tanggal sekaligus</summary>
   <form id="tm-schedule-bulk-form" class="tm-schedule-form">
    <label>Nama<select class="field" name="staff_key" required>${options}</select></label>
    <label>Dari<input class="field" name="from" type="date" min="${today}" value="${day>=today?day:today}" required></label>
    <label>Sampai<input class="field" name="to" type="date" min="${today}" value="${day>=today?day:today}" required></label>
    <button class="btn danger sm" type="submit">Hapus jadwal pada rentang ini</button>
   </form><p class="small muted">Maksimum 62 hari. Jika satu tanggal memiliki bukti/penugasan, seluruh penghapusan dibatalkan.</p>
  </details>
 </div></details>`;
}
function refreshScheduleEditorHint(){
 const form=document.getElementById('tm-schedule-form');if(!form)return;
 const p=IMPORTED.staff.find(x=>x.key===form.elements.staff_key.value),day=form.elements.day.value;
 const code=p?.schedule?.[day]||'';
 const hint=document.getElementById('tm-schedule-current');if(hint)hint.textContent='Jadwal di Cloud: '+(code||'Belum ada / dihapus');
 const select=form.elements.code;if(select&&code&&[...select.options].some(x=>x.value===code))select.value=code;
}
async function editImportedSchedule(staffKey,day,code){
 if(state.mode!=='cloud'||!isAdmin())throw Error('Hanya Admin Tim yang bisa mengubah jadwal.');
 const person=IMPORTED.staff.find(p=>p.key===staffKey);if(!person)throw Error('Nama karyawan tidak ditemukan.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Tanggal tidak valid.');
 const initial=person.schedule?.[day]||'Tidak ada';
 if(!confirm(`${person.name} • ${day}\nJadwal sebelumnya: ${initial}\nJadwal baru: ${code||'HAPUS'}\n\nPerbarui data impor dan roster cloud sekaligus?`))return;
 const {data,error}=await state.db.rpc('update_imported_staff_schedule',{p_workspace:state.workspace.id,p_staff_key:staffKey,p_day:day,p_code:code||null});
 if(error)throw error;
 await refreshCloud();notify(data?.changed===false?'Jadwal sudah sesuai Cloud':'Jadwal berhasil diperbarui di Cloud dan HP');
}
async function deleteImportedRange(form){
 if(state.mode!=='cloud'||!isAdmin())throw Error('Hanya admin yang bisa menghapus jadwal.');
 const d=new FormData(form),staffKey=String(d.get('staff_key')||''),from=String(d.get('from')||''),to=String(d.get('to')||'');
 const person=IMPORTED.staff.find(p=>p.key===staffKey);if(!person)throw Error('Nama karyawan tidak valid.');
 if(!confirm(`HAPUS jadwal ${person.name} dari ${from} sampai ${to}?\nRiwayat foto/checklist terlindungi. Tindakan ini tidak dapat dibatalkan.`))return;
 const {data,error}=await state.db.rpc('delete_imported_schedule_range',{p_workspace:state.workspace.id,p_staff_key:staffKey,p_from:from,p_to:to});
 if(error)throw error;
 await refreshCloud();notify(`${data??0} tanggal jadwal dihapus dari Cloud`);
}
function rosterSourcePanel(s=state.shiftNumber){
 const day=cleanShiftDate(),fileDay=IMPORTED.staff.some(p=>Object.hasOwn(p.schedule||{},day)),planned=staffForDay(s,day),linked=planned.filter(p=>linkedUid(p));
 return `<section class="panel source-roster-panel"><div class="shift-summary-head"><h3>📅 Jadwal dari Excel · Shift ${s}</h3><span>${esc(SHIFT_HOURS[s])}</span></div>
 <p class="small muted" style="margin-bottom:10px">Sumber: Excel yang diimpor oleh admin. Kode ${CODE_FOR_SHIFT[s]}; Shift 3 dicatat sesuai tanggal mulai 21.30.</p>
 ${fileDay?(planned.length?`<div class="staff-chip-grid">${planned.map(p=>`<div class="staff-source-chip"><strong>${esc(p.name)}</strong><small>${p.racks.length} rak · ${esc(p.schedule[day])}</small><span class="${linkedUid(p)?'linked':'pending'}">${linkedUid(p)?'✓ '+(state.mode==='demo'?'Data demo': 'Akun ditautkan'):'Akun belum ditautkan'}</span></div>`).join('')}</div>`:'<div class="notice info">Tidak ada karyawan dengan kode shift ini pada tanggal terpilih.</div>'):'<div class="notice info">Tidak ada jadwal terimpor untuk tanggal ini. Admin dapat mengimpor Excel bulan baru.</div>'}
 ${state.mode==='cloud'&&planned.length?`<p class="small muted" style="margin-top:10px">${linked.length}/${planned.length} akun ditautkan. Hanya akun yang ditautkan dan sudah diimpor ke roster online yang dapat menerima push.</p>`:''}
 ${scheduleManagerPanel()}
 </section>`;
}
function staffLinkPanel(){
 const connected=new Set(state.staffLinks.map(l=>l.user_id));
 const pending=IMPORTED.staff.filter(p=>!linkedUid(p));
 const available=state.members.filter(m=>(m.status==='approved'||state.mode==='demo')&&!connected.has(m.user_id));
 return `<section class="panel source-roster-panel"><div class="shift-summary-head"><h3>👤 Hubungkan akun karyawan</h3><span>${IMPORTED.staff.length-pending.length}/${IMPORTED.staff.length} terhubung</span></div>
 ${state.mode==='cloud'&&isAdmin()?`<div class="excel-import-box"><strong>📊 Impor dari Excel</strong><p class="small muted">Gunakan 1 file Excel dengan sheet <b>Jadwal</b> dan <b>Rak</b>, atau unggah masing-masing secara terpisah.</p><div class="excel-import-actions"><label class="shift-upload">📅 Impor Excel Jadwal<input type="file" id="shift-excel-import" accept=".xlsx,.xls,.xlsm" /></label><label class="shift-upload">▥ Impor Excel Nomor Rak<input type="file" id="rack-excel-import" accept=".xlsx,.xls,.xlsm" /></label></div><a class="btn outline sm" href="./Template_Import_TaskMate_Jadwal_Rak.xlsx" download>⬇ Unduh template Excel</a><p class="small muted" style="margin-top:8px">Format jadwal: Nama / Tanggal / Kode Shift. Format rak: Nama / Nomor Rak. Data hanya disimpan dalam tim Supabase privat.</p><details><summary>Impor cadangan JSON versi lama</summary><label class="shift-upload">📂 Impor JSON<input id="private-roster-import" type="file" accept="application/json,.json" /></label></details></div>`:''}
 <p class="small muted" style="margin:9px 0">Nama di jadwal Excel harus ditautkan ke akun yang login di HP masing-masing. Tidak boleh otomatis berdasarkan nama, supaya alarm dan ceklis tidak salah petugas.</p>
 ${state.staffLinkError?`<div class="notice" style="margin-bottom:10px">⚠ ${esc(state.staffLinkError)} · Jalankan schema-shift-v4.sql di Supabase.</div>`:''}
 ${state.mode==='demo'?'<div class="notice info">Mode demo memakai 12 karyawan contoh dari jadwal. Untuk multi-HP, aktifkan Supabase dan hubungkan akun anggota tim.</div>':''}
 ${state.mode==='cloud'&&isAdmin()&&!state.staffLinkError?`${pending.length&&available.length?`<form id="staff-link-form" class="shift-roster-form"><label>Nama dalam file Excel</label><select class="field" name="staff_key" required>${pending.map(p=>`<option value="${esc(p.key)}">${esc(p.name)}</option>`).join('')}</select><label>Akun yang sudah bergabung ke tim</label><select class="field" name="user_id" required>${available.map(m=>`<option value="${esc(m.user_id)}">${esc(memberName(m.user_id))}</option>`).join('')}</select><button class="btn primary block" type="submit">🔗 Hubungkan & impor jadwal/rak</button></form>`:'<p class="small muted">Tidak ada kombinasi nama dan akun yang belum ditautkan. Pastikan karyawan sudah login dan bergabung dengan kode tim.</p>'}
 ${state.staffLinks.length?`<button class="btn outline block" data-action="v4-sync-import" style="margin-top:9px">↻ Cocokkan roster online dengan jadwal Cloud</button>`:''}`:''}
 ${state.staffLinks.length?`<div class="staff-link-list">${state.staffLinks.map(l=>{const p=IMPORTED.staff.find(x=>x.key===l.staff_key);return p?`<div><b>${esc(p.name)}</b><small>${esc(memberName(l.user_id))} · ${p.racks.length} rak</small></div>`:''}).join('')}</div>`:''}
 <p class="small muted" style="margin-top:10px">P7: 07.00–17.00 • S14: 14.00–23.00 • M22: 21.30–07.00. Kode O/AO/MT/C tidak dikirim pengingat shift.</p></section>`;
}
async function importExcelStaff(file){
 if(state.mode!=='cloud'||!isAdmin()||!state.workspace)throw new Error('Hanya admin tim yang boleh impor Excel.');
 if(!file)return;
 if(!/\.(xlsx|xls|xlsm)$/i.test(file.name)||file.size>5*1024*1024)throw new Error('Pilih file Excel .xlsx/.xls maksimal 5 MB.');
 if(!window.XLSX||!window.TASKMATE_EXCEL)throw new Error('Pembaca Excel belum dimuat. Periksa koneksi internet, lalu refresh.');
 const book=window.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
 const parsed=window.TASKMATE_EXCEL.parseWorkbook(book,IMPORTED.staff),sum=parsed.summary;
 if(!confirm(`Preview impor Excel:\n${sum.employees} karyawan (${sum.newEmployees} baru)\n${sum.scheduleRows} jadwal\n${sum.rackRows} nomor rak untuk ${sum.changedRackStaff} PIC\n\nJadwal yang tidak ada di file tetap disimpan. Rak aktif PIC yang tercantum dalam file akan diganti sesuai daftar impor.\n\nLanjut simpan ke Supabase?`))return;
 const wid=state.workspace.id,rows=parsed.employees.map(p=>({workspace_id:wid,staff_key:p.key,
  full_name:p.name.slice(0,100),short_name:p.short.slice(0,40),
  month:Object.keys(p.schedule).sort().at(-1)?.slice(0,7)||IMPORTED.month||localDay().slice(0,7),
  racks:p.racks,schedule:p.schedule}));
 for(let n=0;n<rows.length;n+=50){const r=await state.db.from('shift_staff_seed').upsert(rows.slice(n,n+50),{onConflict:'workspace_id,staff_key'});if(r.error)throw r.error;}
 // Perbarui pengguna yang telah ditautkan. Jadwal hari ini dan masa lalu aman dari penimpa otomatis.
 let linked=0,skipped=0;
 for(const p of parsed.employees){
  const userId=state.staffLinks.find(l=>l.staff_key===p.key)?.user_id;
  if(!userId)continue;
  linked++;
  const result=await syncExcelForLinkedStaff(p,userId);
  skipped+=result.skipped;
 }
 await refreshCloud();
 notify(`Impor selesai: ${sum.scheduleRows} jadwal, ${sum.rackRows} rak · ${linked} akun tersinkron${skipped?' · '+skipped+' hari historis tidak ditimpa':''}.`);
}
async function syncExcelForLinkedStaff(p,userId){
 const wid=state.workspace.id,today=localDay();let skipped=0;
 // Daftar rak diperbarui tanpa menghapus entri historis / foto dari rak lama.
 if(p.racksChanged){
  const {data:old,error:e0}=await state.db.from('shift_rack_assignments').select('id,rack_name').eq('workspace_id',wid).eq('user_id',userId).eq('is_active',true);
  if(e0)throw e0;
  const next=new Set(p.racks),inactive=(old||[]).filter(x=>!next.has(x.rack_name)).map(x=>x.id);
  if(inactive.length){const d=await state.db.from('shift_rack_assignments').update({is_active:false}).eq('workspace_id',wid).eq('user_id',userId).in('id',inactive);if(d.error)throw d.error}
  if(next.size){const r=await state.db.from('shift_rack_assignments').upsert([...next].map(rack=>({workspace_id:wid,user_id:userId,rack_name:rack,is_active:true})),{onConflict:'workspace_id,user_id,rack_name'});if(r.error)throw r.error}
 }
 for(const day of [...p.changedDays].sort()){
  if(day<=today){skipped++;continue}
  const times=workTime(day,p.schedule[day]);
  const old=await state.db.from('shift_roster').select('id,shift_number').eq('workspace_id',wid).eq('user_id',userId).eq('work_date',day);
  if(old.error)throw old.error;
  const stale=(old.data||[]).filter(x=>!times||x.shift_number!==times.shift_number).map(x=>x.id);
  if(stale.length){
   const del=await state.db.from('shift_roster').delete().eq('workspace_id',wid).eq('user_id',userId).in('id',stale);
   if(del.error)throw new Error(`Tidak dapat mengganti jadwal ${p.name} ${day} karena ada data shift terkait. ${del.error.message}`);
  }
  if(times){const u=await state.db.from('shift_roster').upsert({workspace_id:wid,user_id:userId,work_date:day,...times},{onConflict:'workspace_id,work_date,shift_number,user_id'});if(u.error)throw u.error}
 }
 return {skipped};
}
async function importPrivateRoster(file){
 if(state.mode!=='cloud'||!isAdmin())throw new Error('Hanya admin yang sudah login dapat mengimpor jadwal.');
 if(!file||file.size>1000000)throw new Error('Pilih JSON jadwal maksimal 1 MB.');
 let doc;try{doc=JSON.parse(await file.text())}catch{throw new Error('File JSON tidak valid.')}
 if(!/^\d{4}-\d{2}$/.test(doc.month||'')||!Array.isArray(doc.staff)||!doc.staff.length||doc.staff.length>150)throw new Error('Format data jadwal tidak sesuai.');
 const seen=new Set();const rows=[];
 for(const p of doc.staff){
  if(!/^staff-[a-zA-Z0-9-]{1,30}$/.test(p.key)||seen.has(p.key)||typeof p.name!=='string'||!p.name.trim()||!Array.isArray(p.racks)||typeof p.schedule!=='object'||!p.schedule||Array.isArray(p.schedule))throw new Error('Ada data karyawan yang tidak valid.');
  seen.add(p.key);
  const schedule={};for(const [day,code] of Object.entries(p.schedule)){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!['P7','S14','M22','O','AO','MT','C'].includes(code))throw new Error('Kode shift atau tanggal tidak sesuai.');schedule[day]=code;
  }
  rows.push({workspace_id:state.workspace.id,staff_key:p.key,full_name:p.name.slice(0,100),short_name:String(p.short||p.name).slice(0,40),month:doc.month,racks:p.racks.map(x=>String(x).slice(0,100)),schedule});
 }
 if(!confirm(`Impor ${rows.length} karyawan ke Supabase privat? Data dengan kunci sama akan diperbarui.`))return;
 for(let i=0;i<rows.length;i+=50){const r=await state.db.from('shift_staff_seed').upsert(rows.slice(i,i+50),{onConflict:'workspace_id,staff_key'});if(r.error)throw r.error}
 await refreshCloud();notify(`${rows.length} karyawan berhasil diimpor ke Supabase privat.`);
}
async function importOneStaff(p,userId){
 const wid=state.workspace.id;
 const schedule=Object.entries(p.schedule).flatMap(([day,code])=>{
  const times=workTime(day,code);return times?[{workspace_id:wid,user_id:userId,work_date:day,...times}]:[];
 });
 if(schedule.length){const r=await state.db.from('shift_roster').upsert(schedule,{onConflict:'workspace_id,work_date,shift_number,user_id'});if(r.error)throw r.error}
 const assignments=p.racks.map(r=>({workspace_id:wid,user_id:userId,rack_name:r,is_active:true}));
 if(assignments.length){const r=await state.db.from('shift_rack_assignments').upsert(assignments,{onConflict:'workspace_id,user_id,rack_name'});if(r.error)throw r.error}
 return {days:schedule.length,racks:assignments.length};
}
async function saveStaffLink(form){
 if(state.mode!=='cloud'||!isAdmin()||state.staffLinkError)throw new Error('Akses admin dan schema v4 diperlukan.');
 const fd=new FormData(form),key=String(fd.get('staff_key')),userId=String(fd.get('user_id'));
 const person=IMPORTED.staff.find(p=>p.key===key);
 if(!person||!state.members.some(m=>m.user_id===userId&&(m.status==='approved'||state.mode==='demo')))throw new Error('Pilih karyawan yang sudah disetujui admin');
 if(state.staffLinks.some(l=>l.staff_key===key||l.user_id===userId))throw new Error('Nama atau akun sudah tertaut ke karyawan lain.');
 const {error}=await state.db.from('shift_staff_links').insert({workspace_id:state.workspace.id,staff_key:key,user_id:userId});if(error)throw error;
 await importOneStaff(person,userId);
 await refreshCloud();notify(`Akun ${person.name} terhubung · jadwal dan ${person.racks.length} rak diimpor`);
}
async function syncImported(){
 if(state.mode!=='cloud'||!isAdmin())throw new Error('Hanya Admin Tim yang dapat menyinkronkan impor.');
 if(!confirm('Ambil jadwal resmi terbaru dari Cloud dan selaraskan roster ONLINE untuk karyawan tertaut? Jadwal yang telah dihapus tidak dikembalikan.'))return;
 // Atomic RPC is the only path to modifying the official roster; it preserves protected records.
 let updated=0;
 for(const link of state.staffLinks){
  const staff=IMPORTED.staff.find(p=>p.key===link.staff_key);if(!staff)continue;
  const days=new Set(Object.keys(staff.schedule||{}).filter(d=>d>=localDay()));
  const r=await state.db.from('shift_roster').select('work_date').eq('workspace_id',state.workspace.id).eq('user_id',link.user_id).gte('work_date',localDay());
  if(r.error)throw r.error;for(const x of r.data||[])days.add(x.work_date);
  for(const day of [...days].sort()){
   const {data,error}=await state.db.rpc('update_imported_staff_schedule',{
    p_workspace:state.workspace.id,p_staff_key:staff.key,p_day:day,p_code:staff.schedule?.[day]||null
   });if(error)throw new Error(`${staff.name} • ${day}: ${error.message}`);
   if(data?.changed)updated++;
  }
 }
 await refreshCloud();notify(`Cloud tersinkron · ${updated} perubahan roster diterapkan`);
}

function effectiveShiftVersion(key,s=state.shiftNumber,day=cleanShiftDate()){
 return state.shiftTaskVersions.filter(v=>v.shift_number===s&&v.item_key===key&&v.effective_from<=day)
 .sort((a,b)=>b.effective_from.localeCompare(a.effective_from)||String(b.created_at||'').localeCompare(String(a.created_at||'')))[0]||null;
}
function shiftAreasFor(s=state.shiftNumber,day=cleanShiftDate()){
 const areas=(shiftCatalog[s]||[]).map(a=>({...a,items:a.items.map(i=>[...i])}));
 const effective=new Map();
 for(const p of state.shiftTaskVersions.filter(v=>v.shift_number===s&&v.effective_from<=day)){
  const existing=effective.get(p.item_key);
  if(!existing||p.effective_from>existing.effective_from||(p.effective_from===existing.effective_from&&String(p.created_at||'')>String(existing.created_at||'')))effective.set(p.item_key,p);
 }
 for(const p of effective.values()){
  for(const a of areas)a.items=a.items.filter(i=>i[0]!==p.item_key);
  if(p.is_active===false)continue;
  let a=areas.find(a=>a.name.toLowerCase()===String(p.area_name).toLowerCase());
  if(!a){a={name:p.area_name||'Lainnya',icon:'☑',items:[]};areas.push(a)}
  a.items.push([p.item_key,p.title,p.details||'']);
 }
 return areas.filter(a=>a.items.length);
}
const shiftItemsFor=s=>shiftAreasFor(s).flatMap(a=>a.items);
const shiftTotal=s=>shiftItemsFor(s).length;
function photoRequiredFor(key,s=state.shiftNumber,day=cleanShiftDate()){
 return key==='foto-selisih'||!!effectiveShiftVersion(key,s,day)?.photo_required;
}
function hasValidShiftPhoto(log){return shiftProofList(log).some(p=>p.mime_type?.startsWith('image/')&&!!p.client_captured_at)}
function localDay(d=new Date()){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
function cleanShiftDate(){return /^\d{4}-\d{2}-\d{2}$/.test(state.shiftDate)?state.shiftDate:localDay();}
function shiftCacheKey(){return 'taskmate-shift-v2-'+(state.workspace?.id||'demo-team');} // pertahankan data versi sebelumnya
function loadShiftDemo(){
 if(state.mode!=='demo')return;
 let v={};try{v=JSON.parse(localStorage.getItem(shiftCacheKey())||'{}')}catch{}
 state.shiftLogs=Array.isArray(v.logs)?v.logs:[];
 state.shiftRoster=Array.isArray(v.roster)?v.roster:[];
 state.shiftProofs=Array.isArray(v.proofs)?v.proofs:[];
 state.rackAssignments=Array.isArray(v.racks)?v.racks:[];
 state.rackChecks=Array.isArray(v.rackChecks)?v.rackChecks:[];
 state.rackPhotos=Array.isArray(v.rackPhotos)?v.rackPhotos:[];
 state.mapPhotos=Array.isArray(v.mapPhotos)?v.mapPhotos:[];
 state.shiftTaskVersions=Array.isArray(v.shiftTaskVersions)?v.shiftTaskVersions:[];state.shiftAdmins=Array.isArray(v.shiftAdmins)?v.shiftAdmins:[];state.shiftPics=Array.isArray(v.shiftPics)?v.shiftPics:[];state.shiftTaskConfigError='';
 state.shiftReady=true;state.shiftError='';state.rackError='';
}
function persistShiftDemo(){
 if(state.mode!=='demo')return;
 try{localStorage.setItem(shiftCacheKey(),JSON.stringify({logs:state.shiftLogs,roster:state.shiftRoster,proofs:state.shiftProofs,racks:state.rackAssignments,rackChecks:state.rackChecks,rackPhotos:state.rackPhotos,mapPhotos:state.mapPhotos,shiftTaskVersions:state.shiftTaskVersions,shiftAdmins:state.shiftAdmins,shiftPics:state.shiftPics}))}
 catch(e){notify('Memori demo penuh. Kurangi foto atau gunakan mode cloud.',true)}
}
async function loadShiftCloud(){
 if(state.mode!=='cloud'||!state.workspace)return;
 const wid=state.workspace.id,day=cleanShiftDate();
 const privateRoster=await state.db.from('shift_staff_seed').select('staff_key,full_name,short_name,month,racks,schedule').eq('workspace_id',wid);
 if(!privateRoster.error){const people=privateRoster.data||[];IMPORTED={...window.TASKMATE_IMPORTED,month:people[0]?.month||'2026-11',staff:people.map(p=>({key:p.staff_key,name:p.full_name,short:p.short_name,racks:p.racks,schedule:p.schedule}))};}
 else{state.privateRosterError=privateRoster.error.message;}
 const [roster,logs,racks,checks,staffLinks,rackPhotos,mapPhotos,pointVersions,shiftAdmins,shiftPics]=await Promise.all([
  state.db.from('shift_roster').select('*').eq('workspace_id',wid).eq('work_date',day).order('start_at'),
  state.db.from('shift_logs').select('*').eq('workspace_id',wid).eq('work_date',day),
  state.db.from('shift_rack_assignments').select('*').eq('workspace_id',wid).eq('is_active',true).order('rack_name'),
  state.db.from('shift_rack_checks').select('*').eq('workspace_id',wid).eq('work_date',day),
  state.db.from('shift_staff_links').select('staff_key,user_id').eq('workspace_id',wid),
  state.db.from('shift_rack_photos').select('*').eq('workspace_id',wid).eq('work_date',day).order('created_at',{ascending:false}),
  state.db.from('shift_map_photos').select('*').eq('workspace_id',wid).eq('work_date',day),
  state.db.from('shift_task_versions').select('*').eq('workspace_id',wid),
  state.db.from('shift_shift_admins').select('*').eq('workspace_id',wid).eq('work_date',day),
  state.db.from('shift_task_pics').select('*').eq('workspace_id',wid).eq('work_date',day)
 ]);
 if(roster.error||logs.error){state.shiftReady=false;state.shiftError='Modul Shift memerlukan schema-shift.sql. Jalankan migrasi sebelum memakai cloud.';return;}
 if(state.workspace?.id!==wid)return;
 state.shiftRoster=roster.data||[];state.shiftLogs=logs.data||[];
 state.rackAssignments=racks.data||[];state.rackChecks=checks.data||[];
 state.rackPhotos=rackPhotos.data||[];state.mapPhotos=mapPhotos.data||[];
 state.shiftAdmins=shiftAdmins.data||[];state.shiftPics=shiftPics.data||[];state.shiftPicError=shiftAdmins.error||shiftPics.error?'Pemasangan Admin Shift/PIC belum tersedia di Supabase.':'';
 state.shiftTaskVersions=pointVersions.data||[];state.shiftTaskConfigError=pointVersions.error?'Kelola poin memerlukan schema-shift-v8.sql.':'';
 state.photoSetupError=rackPhotos.error||mapPhotos.error?'Modul foto rak / Map Do It memerlukan schema-shift-v5.sql.':'';
 state.staffLinks=staffLinks.data||[];state.staffLinkError=staffLinks.error?'Tabel pemetaan akun belum diaktifkan':'';
 state.rackError=racks.error||checks.error?'Pengaturan rak belum tersedia. Jalankan schema-shift-v3.sql di Supabase.':'';
 const ids=state.shiftLogs.map(l=>l.id);state.shiftProofs=[];
 if(ids.length){const r=await state.db.from('shift_evidence').select('*').in('log_id',ids);if(r.error){state.shiftError=r.error.message;return}state.shiftProofs=r.data||[]}
 state.shiftReady=true;state.shiftError='';
}
function shiftLog(item,s=state.shiftNumber){return state.shiftLogs.find(x=>x.work_date===cleanShiftDate()&&x.shift_number===s&&x.item_key===item)}
function shiftProofList(log){return log?state.shiftProofs.filter(x=>x.log_id===log.id):[]}
function shiftScheduled(s=state.shiftNumber){return state.shiftRoster.filter(r=>r.shift_number===s&&r.work_date===cleanShiftDate())}
function shiftCanCheck(s=state.shiftNumber){return state.mode==='demo'||isAdmin()||shiftScheduled(s).some(r=>r.user_id===state.user?.id)}
function shiftAdminRow(s=state.shiftNumber){return state.shiftAdmins.find(a=>a.work_date===cleanShiftDate()&&a.shift_number===s)}
function isShiftLead(s=state.shiftNumber){return state.mode==='demo'||isAdmin()||shiftAdminRow(s)?.user_id===state.user?.id}
function assignedPic(key,s=state.shiftNumber){return state.shiftPics.find(p=>p.work_date===cleanShiftDate()&&p.shift_number===s&&p.item_key===key)}
// Tugas Saya adalah tampilan standar setiap akun (termasuk Admin Tim/Admin Shift).
// Pemantauan tim harus diaktifkan secara eksplisit oleh admin dan hanya bersifat baca untuk tugas milik PIC lain.
function canMonitorShift(s=state.shiftNumber){return state.mode==='demo'||isShiftLead(s)}
function monitoringShift(s=state.shiftNumber){return state.shiftView==='team'&&canMonitorShift(s)}
function assignedToCurrentUser(key,s=state.shiftNumber){
 const p=assignedPic(key,s),linked=state.staffLinks.find(l=>l.staff_key===p?.staff_key);
 return !!(p&&linked?.user_id===state.user?.id);
}
function canPerformShiftItem(key,s=state.shiftNumber){
 if(state.mode==='demo')return true;
 if(!shiftScheduled(s).some(r=>r.user_id===state.user?.id))return false;
 if(key==='sisir-harga'||key==='map-do-it')return true;
 return assignedToCurrentUser(key,s);
}
function visibleShiftTask(key,s=state.shiftNumber){
 if(state.mode==='demo')return true;
 if(monitoringShift(s))return true;
 // Sisir Harga selalu terlihat bagi akun aktif; raknya tetap dibatasi menurut akun & roster.
 if(key==='sisir-harga')return true;
 if(!shiftScheduled(s).some(r=>r.user_id===state.user?.id))return false;
 if(key==='map-do-it')return true;
 return assignedToCurrentUser(key,s);
}
function picStaffForShift(s=state.shiftNumber){
 const byKey=new Map(staffForDay(s).map(person=>[person.key,person]));
 for(const r of shiftScheduled(s))for(const l of state.staffLinks.filter(x=>x.user_id===r.user_id)){
  const member=IMPORTED.staff.find(x=>x.key===l.staff_key);
  if(member)byKey.set(member.key,member);
 }
 return [...byKey.values()];
}
function shiftAssignmentPanel(s=state.shiftNumber){
 const chosen=shiftAdminRow(s),staff=picStaffForShift(s),lead=shiftScheduled(s)
 .filter(r=>state.members.some(m=>m.user_id===r.user_id&&m.status==='approved'));
 if(state.shiftPicError)return `<div class="notice">⚠ ${esc(state.shiftPicError)}</div>`;
 const isManager=isShiftLead(s),total=shiftItemsFor(s).filter(([k])=>!['sisir-harga','map-do-it'].includes(k));
 if(!isManager&&!isAdmin())return `<section class="panel tm-shift-assignment"><h3>👤 PIC Shift ${s}</h3><p class="small muted">Admin Shift: <b>${esc(chosen?memberName(chosen.user_id):'Belum ditentukan')}</b></p><p class="small muted">Tugas yang tampil sesuai penugasan PIC Anda. Sisir Harga dan Map Do It tetap tersedia untuk setiap petugas terjadwal.</p></section>`;
 const panelKey=`${cleanShiftDate()}:${s}`,expanded=!!state.assignmentPanelsOpen?.[panelKey];
 const assigned=total.filter(([k])=>!!assignedPic(k,s)).length;
 return `<section class="panel tm-shift-assignment" data-expanded="${expanded}">
 <button type="button" class="tm-shift-assignment-toggle" data-action="shift-assignment-toggle" data-shift="${s}" aria-expanded="${expanded}" aria-controls="tm-shift-assignment-body">
  <span class="tm-shift-assignment-label"><strong>👑 Admin Shift & Pembagian PIC</strong><small>${esc(chosen?memberName(chosen.user_id):'Belum ada Admin Shift')} · ${assigned}/${total.length} tugas dibagi</small></span>
  <span class="tm-shift-assignment-pill">${expanded?'Tutup':'Buka'} <span aria-hidden="true" class="tm-shift-assignment-chevron">▾</span></span>
 </button>
 <div class="tm-shift-assignment-body" id="tm-shift-assignment-body" ${expanded?'':'hidden'}>
 <p class="small muted">${esc(cleanShiftDate())} · Shift ${s} · Penugasan berlaku khusus tanggal ini. Tugas tanpa PIC tidak tampil di akun karyawan.</p>
 <div class="tm-shift-admin-picker"><label><b>Admin Shift</b><small>Hanya satu orang per shift</small></label>
 <select class="field" data-action="shift-admin-select" data-shift="${s}" ${!isAdmin()?'disabled':''}><option value="">-- Belum ditentukan --</option>${lead.map(r=>`<option value="${esc(r.user_id)}" ${r.user_id===chosen?.user_id?'selected':''}>${esc(memberName(r.user_id))}</option>`).join('')}</select></div>
 ${!lead.length?'<p class="small muted">Tautkan akun dan sinkronkan jadwal dulu agar Admin Shift bisa dipilih.</p>':''}
 <div class="tm-pic-list">${shiftAreasFor(s).flatMap(area=>area.items.filter(([k])=>!['sisir-harga','map-do-it'].includes(k)).map(([key,title])=>{
 const pic=assignedPic(key,s),selected=pic?.staff_key||'';
 return `<div class="tm-pic-row"><div><strong>${esc(title)}</strong><small>${esc(area.name)}</small></div><select class="field" data-action="shift-pic-select" data-item="${esc(key)}" data-shift="${s}"><option value="">-- Belum ada PIC --</option>${staff.map(x=>`<option value="${esc(x.key)}" ${selected===x.key?'selected':''}>${esc(x.name)}${linkedUid(x)?'':' · belum login'}</option>`).join('')}</select></div>`;
 })).join('')}</div><p class="small muted">Sisir Harga otomatis tampil di semua akun sesuai nomor rak pribadi. Map Do It tetap per petugas. Perubahan PIC setelah foto/ceklis tidak diperbolehkan agar riwayat aman.</p></div></section>`;
}
async function setShiftAdmin(userId,shift){
 if(!isAdmin())throw new Error('Hanya Admin Tim yang dapat memilih Admin Shift');
 if(!userId)throw new Error('Pilih satu anggota terjadwal sebagai Admin Shift.');
 if(state.mode==='demo'){
  state.shiftAdmins=state.shiftAdmins.filter(a=>!(a.work_date===cleanShiftDate()&&a.shift_number===shift));
  state.shiftAdmins.push({work_date:cleanShiftDate(),shift_number:shift,user_id:userId});
 }else{
  const r=await state.db.rpc('set_shift_admin',{p_workspace:state.workspace.id,p_day:cleanShiftDate(),p_shift:shift,p_user:userId});if(r.error)throw r.error;
 }
 await afterShiftMutation();notify('Admin Shift berhasil ditentukan');
}
async function setShiftPic(item,staffKey,shift){
 if(!isShiftLead(shift))throw new Error('Hanya Admin Shift atau Admin Tim yang boleh membagi PIC');
 if(['sisir-harga','map-do-it'].includes(item))throw new Error('Tugas ini wajib tersedia untuk semua petugas');
 if(state.mode==='demo'){
  state.shiftPics=state.shiftPics.filter(a=>!(a.work_date===cleanShiftDate()&&a.shift_number===shift&&a.item_key===item));
  if(staffKey)state.shiftPics.push({work_date:cleanShiftDate(),shift_number:shift,item_key:item,staff_key:staffKey});
 }else{
  const r=await state.db.rpc('assign_shift_task_pic',{p_workspace:state.workspace.id,p_day:cleanShiftDate(),p_shift:shift,p_item:item,p_staff:staffKey||null});if(r.error)throw r.error;
 }
 await afterShiftMutation();notify(staffKey?'PIC berhasil ditentukan':'PIC dikosongkan');
}
function onShiftNow(s=state.shiftNumber){const now=Date.now();return shiftScheduled(s).some(r=>r.user_id===state.user?.id&&new Date(r.start_at).getTime()<=now&&new Date(r.end_at).getTime()>now)}
function todayShiftStatus(s=state.shiftNumber){if(state.mode==='demo')return 'DEMO • jadwal Excel terisi (lokal)';if(!shiftScheduled(s).length)return `Belum ada jadwal Shift ${s}`;if(onShiftNow(s))return `Sedang masuk Shift ${s}`;return shiftScheduled(s).some(x=>x.user_id===state.user?.id)?`Terjadwal Shift ${s}`:`Tidak terjadwal Shift ${s}`}
function rackListForShift(s=state.shiftNumber){
 const users=new Set(shiftScheduled(s).map(r=>r.user_id));
 return state.rackAssignments.filter(x=>x.is_active!==false&&users.has(x.user_id));
}
function rackCheck(rackId,s=state.shiftNumber){return state.rackChecks.find(c=>c.work_date===cleanShiftDate()&&c.shift_number===s&&c.assignment_id===rackId)}
function rackPhotosFor(rackId,s=state.shiftNumber){return state.rackPhotos.filter(p=>p.work_date===cleanShiftDate()&&p.shift_number===s&&p.assignment_id===rackId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));}
function latestRackPhoto(id,s=state.shiftNumber){return rackPhotosFor(id,s)[0]||null;}
function mapPhotoFor(userId,s=state.shiftNumber){return state.mapPhotos.find(p=>p.work_date===cleanShiftDate()&&p.shift_number===s&&p.user_id===userId)||null;}
function rackCheckedWithPhoto(r,s=state.shiftNumber){
 const check=rackCheck(r.id,s),photo=latestRackPhoto(r.id,s);
 if(!check?.is_checked||!photo||!photo.client_captured_at)return false;
 return true; // Checklist manual + foto kamera dengan waktu pengambilan adalah syarat selesai.
}
function rackProgress(s=state.shiftNumber){const arr=rackListForShift(s);return {done:arr.filter(r=>rackCheckedWithPhoto(r,s)).length,total:arr.length,photos:arr.filter(r=>!!latestRackPhoto(r.id,s)).length};}
function mapProgress(s=state.shiftNumber){const crew=shiftScheduled(s);return {total:crew.length,done:crew.filter(r=>!!mapPhotoFor(r.user_id,s)?.client_captured_at).length};}
function shiftItemDone(key,s=state.shiftNumber){
 if(key==='sisir-harga'){const r=rackProgress(s);return r.total>0&&r.done===r.total;}
 if(key==='map-do-it'){const m=mapProgress(s);return m.total>0&&m.done===m.total;}
 const log=shiftLog(key,s);
 if(photoRequiredFor(key,s))return !!log?.is_checked&&hasValidShiftPhoto(log);
 return !!log?.is_checked;
}
function shiftDoneCount(s){return shiftItemsFor(s).filter(([key])=>shiftItemDone(key,s)).length}
function myShiftItems(s){return shiftItemsFor(s).filter(([key])=>visibleShiftTask(key,s))}
function myShiftTotal(s){return myShiftItems(s).length}
function myShiftDoneCount(s){return myShiftItems(s).filter(([key])=>shiftItemDone(key,s)).length}
function shiftTabs(){return `<div class="shift-tabs" role="tablist" aria-label="Pilih shift">${shiftNumbers.map(s=>{const done=myShiftDoneCount(s),total=myShiftTotal(s);return `<button role="tab" aria-selected="${s===state.shiftNumber}" data-action="shift-select" data-shift="${s}" class="shift-tab ${s===state.shiftNumber?'active':''}"><span>Shift ${s}</span><b>${done}/${total}</b></button>`}).join('')}</div>`}
function dateControls(){return `<div class="shift-datebar"><button class="btn outline sm" data-action="shift-prev" title="Tanggal sebelumnya">‹</button><input type="date" id="shift-date" value="${cleanShiftDate()}" aria-label="Tanggal kerja"><button class="btn outline sm" data-action="shift-next" title="Tanggal berikutnya">›</button><button class="btn soft sm" data-action="shift-today">Hari ini</button></div>`}
function progressBar(done,all){return `<div class="shift-progress-track"><span style="width:${all?100*done/all:0}%"></span></div>`}
function pocketShiftTrend(){
 const points=shiftNumbers.map((s,i)=>{const all=myShiftTotal(s),done=myShiftDoneCount(s);return [24+146*i,78-(all?56*done/all:0),all?Math.round(100*done/all):0]});
 const d=points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y.toFixed(1)}`).join(' ');
 return `<section class="tm-pk-trend"><div class="tm-pk-trend-title"><strong>Progres hari ini</strong><span>CHECKLIST · ${esc(cleanShiftDate())}</span></div><div class="tm-pk-trend-legend"><span>● Selesai</span><span>◦ Belum</span></div><svg viewBox="0 0 340 104" role="img" aria-label="Persentase pekerjaan selesai Shift 1 sampai Shift 3" preserveAspectRatio="none"><defs><pattern id="tm-pk-dotgrid" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#968d86"/></pattern></defs><rect x="0" y="0" width="340" height="88" fill="url(#tm-pk-dotgrid)" opacity=".62"/><path d="${d}" fill="none" stroke="#fff0d6" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>${points.map(([x,y,n],i)=>`<circle cx="${x}" cy="${y.toFixed(1)}" r="5" fill="#ffcb8c" stroke="#403b38" stroke-width="2"/><text x="${x}" y="${Math.max(12,y-10).toFixed(1)}" text-anchor="middle" fill="#f1d0b0" font-size="12" font-weight="800">${n}%</text><text x="${x}" y="102" text-anchor="middle" fill="#dfd3c8" font-size="11">Shift ${i+1}</text>`).join('')}</svg></section>`;
}
function shiftDashboard(){
 const total=shiftNumbers.reduce((n,s)=>n+myShiftTotal(s),0),done=shiftNumbers.reduce((n,s)=>n+myShiftDoneCount(s),0);
 const unfinished=shiftNumbers.flatMap(s=>shiftAreasFor(s).flatMap(a=>a.items.filter(([key])=>visibleShiftTask(key,s)&&!shiftItemDone(key,s)).map(([key,title])=>({s,key,title,area:a.name}))));
 const completed=shiftNumbers.flatMap(s=>shiftAreasFor(s).flatMap(a=>a.items.filter(([key])=>visibleShiftTask(key,s)&&shiftItemDone(key,s)).map(([key,title])=>({s,key,title,area:a.name}))));
 return `<div class="section-header" style="margin-top:0"><div><h2>Dashboard checklist harian</h2><p>Pencapaian Shift 1, Shift 2 dan Shift 3 · ${esc(cleanShiftDate())}</p></div><button class="btn outline sm" data-action="shift-export-all">↓ Rekap 3 Shift</button></div>
 ${dateControls()}
 ${pocketShiftTrend()}<div class="source-summary">${shiftNumbers.map(s=>`<div class="source-summary-card"><div class="tm-pocket-summary-head"><span class="tm-pocket-summary-icon" aria-hidden="true">${tmPocketGlyph(['','broom','cart','moon'][s])}</span><strong>Shift ${s} <small>${esc(CODE_FOR_SHIFT[s])}</small></strong></div><span>${esc(SHIFT_HOURS[s])}</span><b>${staffForDay(s).length} petugas</b><small>${staffForDay(s).map(p=>esc(p.short)).join(' · ')||'Tidak terjadwal di file'}</small><div class="tm-pk-belly"><div class="tm-pk-pips" aria-hidden="true"><i></i><i></i><i></i><i></i></div><b>${staffForDay(s).length} petugas</b><small>${esc(SHIFT_HOURS[s])}</small><span class="tm-pk-stars" aria-hidden="true">✦ ✦ ✦</span></div></div>`).join('')}<div class="source-summary-card tm-pk-extra"><div class="tm-pocket-summary-head"><span class="tm-pocket-summary-icon" aria-hidden="true">${tmPocketGlyph('camera')}</span><strong>Bukti Rak</strong></div><div class="tm-pk-belly"><div class="tm-pk-pips" aria-hidden="true"><i></i><i></i><i></i><i></i></div><b>${shiftNumbers.reduce((v,s)=>v+rackProgress(s).done,0)} / ${shiftNumbers.reduce((v,s)=>v+rackProgress(s).total,0)}</b><small>Rak dengan foto</small><span class="tm-pk-stars" aria-hidden="true">✦ ✦ ✦</span></div></div></div>
 <section class="metrics shift-dashboard-metrics">${metric('Total checklist',total,'▤','','Tugas terlihat di akun ini')}${metric('Sudah dikerjakan',done,'✓','green',`${total?Math.round(done/total*100):0}% pencapaian`)}${metric('Belum dikerjakan',total-done,'⌛','amber','Memerlukan tindakan')}${metric('Rak + foto',shiftNumbers.reduce((v,s)=>v+rackProgress(s).done,0)+'/'+shiftNumbers.reduce((v,s)=>v+rackProgress(s).total,0),'▥','','Wajib foto per rak')}${metric('Foto Map Do It',shiftNumbers.reduce((v,s)=>v+mapProgress(s).done,0)+'/'+shiftNumbers.reduce((v,s)=>v+mapProgress(s).total,0),'📷','','1 foto per petugas shift')}</section>
 <div class="shift-overview">${shiftNumbers.map(s=>{const d=myShiftDoneCount(s),n=myShiftTotal(s);return `<button class="shift-overview-card" data-action="shift-go" data-shift="${s}"><div class="shift-overview-title"><strong>Shift ${s}</strong><span>${d===n?'✓ Selesai':`${n-d} belum`}</span></div><div class="shift-overview-big">${n?Math.round(100*d/n):0}<small>%</small></div>${progressBar(d,n)}<p>${d} dari ${n} pekerjaan selesai</p></button>`}).join('')}</div>
 <div class="shift-summary-list"><section class="panel"><div class="shift-summary-head"><h3>⌛ Belum dikerjakan</h3><span>${unfinished.length} tugas</span></div>${unfinished.length?unfinished.slice(0,15).map(x=>`<button class="shift-summary-row" data-action="shift-go" data-shift="${x.s}"><b>Shift ${x.s}</b><div><strong>${esc(x.title)}</strong><small>${esc(x.area)}</small></div><span>›</span></button>`).join(''):'<p class="small muted" style="padding:12px 0">Seluruh checklist sudah selesai.</p>'}${unfinished.length>15?`<p class="small muted" style="margin-top:12px">${unfinished.length-15} pekerjaan lainnya. Buka tab shift untuk melihat semua.</p>`:''}</section>
 <section class="panel"><div class="shift-summary-head"><h3>✓ Sudah dikerjakan</h3><span>${completed.length} tugas</span></div>${completed.length?completed.slice(0,15).map(x=>`<button class="shift-summary-row" data-action="shift-go" data-shift="${x.s}"><b class="done">Shift ${x.s}</b><div><strong>${esc(x.title)}</strong><small>${esc(x.area)}</small></div><span>✓</span></button>`).join(''):'<p class="small muted" style="padding:12px 0">Belum ada checklist yang dicentang.</p>'}${completed.length>15?`<p class="small muted" style="margin-top:12px">${completed.length-15} tugas selesai lainnya.</p>`:''}</section></div>`;
}
function photoAuditBadge(photo){
 if(!photo)return '';
 if(!photo.client_captured_at)return '<span class="proof-audit needs">⚠ Bukti lama: foto ulang wajib</span>';
 if(state.mode==='demo')return '<span class="proof-audit demo">◷ Waktu kamera HP (demo)</span>';
 if(!photo.server_received_at)return '<span class="proof-audit needs">⌛ Waktu server belum tersedia</span>';
 return `<span class="proof-audit good">✓ Diterima server ${esc(niceTime(photo.server_received_at))}</span>`;
}
function rackProgressDetails(s=state.shiftNumber){
 const schedule=shiftScheduled(s),allRacks=rackListForShift(s),
 racks=state.mode==='demo'?allRacks:allRacks.filter(r=>r.user_id===state.user?.id),
 p={done:racks.filter(r=>rackCheckedWithPhoto(r,s)).length,total:racks.length,
 photos:racks.filter(r=>!!latestRackPhoto(r.id,s)).length};
 if(!schedule.length)return `<div class="rack-panel"><div class="notice info">Belum ada jadwal Shift ${s}; tambah petugas agar foto dan ceklis rak aktif.</div></div>`;
 if(!racks.length)return `<div class="rack-panel"><div class="notice info">${state.mode!=='demo'?'Belum ada rak yang ditugaskan ke akun Anda pada Shift '+s+'. Minta admin menyinkronkan PIC rak.':'Daftar rak petugas belum dimasukkan.'}</div></div>`;
 const groups=[...new Set(racks.map(x=>x.user_id))];
 return `<div class="rack-panel"><div class="rack-head"><b>Foto kamera + crop tiap rak</b><span>${p.done}/${p.total} selesai</span></div>
 <div class="rack-target-stats">${state.mode!=='demo'?'<span>Rak saya saja</span>':''}<span>📷 ${p.photos}/${p.total} foto rak</span><span>✓ ${p.done} sudah dicek manual</span></div>
 <div class="tm-inner-scroll-note" aria-hidden="true">↕ Gulir nomor rak di dalam kotak ini</div>
 <div class="tm-rack-scroll" data-taskmate-inner-scroll="rack" data-taskmate-scroll-scope="${esc(cleanShiftDate())}:${s}:rack" tabindex="0" role="region" aria-label="Daftar nomor rak Sisir Harga — gulir daftar rak">
 ${groups.map(u=>{
  const list=racks.filter(r=>r.user_id===u),finished=list.filter(r=>rackCheckedWithPhoto(r,s)).length;
  return `<div class="rack-person"><div class="rack-person-head"><b>${esc(memberName(u))}</b><small>${finished}/${list.length} rak</small></div>
  ${list.map(r=>{
   const ch=rackCheck(r.id,s),photo=latestRackPhoto(r.id,s),ok=rackCheckedWithPhoto(r,s),can=shiftCanCheck(s)&&(state.mode==='demo'||isAdmin()||state.user?.id===u);
   return `<div class="rack-photo-row ${ok?'done':''}"><div class="rack-photo-top"><label class="rack-checkbox"><input type="checkbox" data-action="shift-rack-check" data-id="${esc(r.id)}" ${ok?'checked':''} ${!can||!photo?'disabled':''}><strong>${esc(r.rack_name)}</strong></label><small>${ok?'✓ Selesai':'Belum selesai'}</small></div>
   <div class="rack-photo-actions"><button type="button" class="shift-upload ${!can?'disabled':''}" data-action="camera-open" data-kind="rack" data-id="${esc(r.id)}" ${!can?'disabled':''}>📷 ${photo?'Foto ulang • kamera':'Kamera rak + crop'}</button>
   ${photo?`<button class="btn outline sm" data-action="extra-open" data-kind="rack" data-id="${esc(photo.id)}">Lihat foto</button>`:''}</div>
   <div class="rack-photo-ai">${photoAuditBadge(photo)}${photo?'<span class="proof-audit good">✓ Foto tersimpan · periksa label harga langsung</span>':''}${ch?.manual_note?`<p>✓ Catatan: ${esc(ch.manual_note)}</p>`:''}</div>
   </div>`;
  }).join('')}</div>`;
 }).join('')}</div>
 <p class="small muted" style="margin-top:12px">Setiap rak wajib difoto menggunakan kamera aplikasi dan di-crop sesuai area rak. Setelah foto tersimpan di cloud, PIC wajib memeriksa langsung semua label harga pada rak sebelum mencentang selesai. Foto dan waktu pengambilan tetap tercatat.</p></div>`;
}
function mapProgressDetails(s=state.shiftNumber){
 const allCrew=shiftScheduled(s),crew=(state.mode==='demo'||monitoringShift(s))?allCrew:allCrew.filter(r=>r.user_id===state.user?.id),p=mapProgress(s);
 return `<div class="rack-panel map-panel"><div class="rack-head"><b>Map Do It per karyawan</b><span>${p.done}/${p.total} foto</span></div>
 <div class="map-progress-help">Target otomatis: <b>${p.total} foto</b> dari <b>${p.total} petugas</b> yang masuk Shift ${s}. Satu foto kamera langsung + nama rak per orang.</div>
 <div class="tm-inner-scroll-note" aria-hidden="true">↕ Gulir daftar petugas Map Do It di dalam kotak ini</div>
 <div class="tm-map-scroll" data-taskmate-inner-scroll="map" data-taskmate-scroll-scope="${esc(cleanShiftDate())}:${s}:map" tabindex="0" role="region" aria-label="Daftar petugas dan isian nomor rak Map Do It — gulir di dalam kotak">
 ${crew.length?crew.map(r=>{
  const file=mapPhotoFor(r.user_id,s),can=shiftCanCheck(s)&&(state.mode==='demo'||state.user?.id===r.user_id);
  return `<div class="map-crew-card" data-crew="${esc(r.user_id)}"><div class="map-crew-top"><b>${esc(memberName(r.user_id))}</b>${file?.client_captured_at?'<span class="mini-done">✓ Foto terkirim</span>':'<span class="mini-todo">Belum ada foto v7</span>'}</div>
  <div class="map-crew-content"><input class="field" data-map-note="${esc(r.user_id)}" maxlength="100" placeholder="Rak yang di-Map Do It (contoh: HA5)" value="${esc(file?.rack_note||'')}" ${!can?'disabled':''}>
  <div class="map-crew-actions"><button type="button" class="shift-upload ${!can?'disabled':''}" data-action="camera-open" data-kind="map" data-id="${esc(r.user_id)}" ${!can?'disabled':''}>📷 ${file?'Foto ulang • kamera':'Ambil foto Map Do It'}</button>
  ${file?`<button class="btn outline sm" data-action="extra-open" data-kind="map" data-id="${esc(file.id)}">Lihat foto</button>${photoAuditBadge(file)}`:''}</div></div></div>`;
 }).join(''):'<div class="notice info">Belum ada petugas terjadwal pada shift ini.</div>'}</div>
 <p class="small muted" style="margin-top:12px">Map Do It otomatis selesai setelah seluruh petugas shift mengunggah satu foto. Petugas dapat mengganti foto miliknya bila perlu.</p></div>`;
}
function shiftPage(){
 const s=state.shiftNumber,day=cleanShiftDate(),areas=shiftAreasFor(s),work=shiftScheduled(s),done=myShiftDoneCount(s),all=myShiftTotal(s),can=shiftCanCheck(s),watchAll=monitoringShift(s);
 const filter=state.shiftFilter;
 return `${shiftTabs()}<section class="shift-hero"><div><div class="tagline">DAILY SHIFT CHECKLIST</div><h2>Shift ${s} · Operasional Toko</h2><p>Checklist per area, pencapaian, PIC rak, foto tiap rak dan Map Do It per petugas.</p><span class="shift-status">${esc(todayShiftStatus(s))}</span></div><div class="shift-hero-score"><b>${done}<small> / ${all}</small></b><span>Pekerjaan selesai</span></div></section>
 <div class="shift-page-controls">${dateControls()}<button type="button" class="btn soft sm" data-action="sync">↻ Sinkronkan Sekarang</button><button class="btn outline sm" data-action="shift-export">↓ Rekap Shift ${s}</button></div>
 ${rosterSourcePanel(s)}
 ${shiftAssignmentPanel(s)}
 <div class="tm-my-tasks-toolbar" aria-label="Pilihan tampilan tugas"><div><strong>${watchAll?'Pantauan Tim':'Tugas Saya'}</strong><small>${watchAll?'Seluruh tugas shift • hanya PIC yang dapat mengerjakan tugas':'Hanya tugas yang ditugaskan kepada akun Anda • Sisir Harga tetap tersedia'}</small></div>${canMonitorShift(s)?`<div class="tm-shift-view-options"><button type="button" data-action="shift-view" data-view="mine" class="${!watchAll?'active':''}" aria-pressed="${!watchAll}">👤 Tugas Saya</button><button type="button" data-action="shift-view" data-view="team" class="${watchAll?'active':''}" aria-pressed="${watchAll}">👁 Pantau Semua</button></div>`:''}</div>
 ${shiftPointManager(s)}
 ${state.shiftError?`<div class="notice" style="margin-bottom:16px">⚠ ${esc(state.shiftError)}</div>`:''}${state.rackError?`<div class="notice" style="margin-bottom:16px">⚠ ${esc(state.rackError)}</div>`:''}${state.photoSetupError?`<div class="notice" style="margin-bottom:16px">⚠ ${esc(state.photoSetupError)}</div>`:''}
 <div class="shift-progress"><div class="shift-progress-head"><b>${watchAll?'Progres Seluruh Shift':'Progres Tugas Saya'} · Shift ${s}</b><strong>${all?Math.round(done/all*100):0}%</strong></div>${progressBar(done,all)}<small>${done} selesai · ${all-done} belum dikerjakan · tiap tanggal tersimpan terpisah</small></div>
 <div class="shift-check-toolbar"><b>Status pekerjaan</b><div class="seg">${[['all','Semua'],['todo','Belum'],['done','Selesai']].map(([key,label])=>`<button data-action="shift-filter" data-filter="${key}" class="${filter===key?'active':''}">${label}</button>`).join('')}</div></div>
 ${!can&&state.mode==='cloud'?`<div class="notice info">Anda bisa memantau laporan, tetapi hanya petugas terjadwal Shift ${s} atau admin yang dapat mengisi checklist.</div>`:''}
 <div class="shift-layout"><div class="shift-area-list">${areas.map(area=>{
  const visible=area.items.filter(([key])=>visibleShiftTask(key,s)&&(filter==='all'||(filter==='done'?shiftItemDone(key,s):!shiftItemDone(key,s))));
  if(!visible.length)return '';
  const visibleAreaItems=area.items.filter(([key])=>visibleShiftTask(key,s));
  const count=visibleAreaItems.filter(([key])=>shiftItemDone(key,s)).length;
  return `<section class="shift-area"><div class="shift-area-head"><div class="shift-area-icon">${area.icon}</div><div><h3>${esc(area.name)}</h3><span>${count} dari ${visibleAreaItems.length} selesai</span></div><b>${visibleAreaItems.length?Math.round(count/visibleAreaItems.length*100):0}%</b></div>
   ${visible.map(([key,title,hint])=>{
    const log=shiftLog(key,s),ok=shiftItemDone(key,s),proofs=shiftProofList(log),isRack=key==='sisir-harga',isMap=key==='map-do-it',photoRequired=photoRequiredFor(key,s),itemCan=canPerformShiftItem(key,s),pic=assignedPic(key,s),picName=IMPORTED.staff.find(x=>x.key===pic?.staff_key)?.name;
    return `<div class="shift-item ${ok?'complete':''}"><div class="shift-item-main"><input type="checkbox" data-action="shift-check" data-id="${esc(key)}" aria-label="${esc(title)}" ${ok?'checked':''} ${!itemCan||isRack||isMap?'disabled':''}><div class="shift-item-text"><strong>${esc(title)}</strong><p>${esc(hint)}</p>${!isRack&&!isMap&&picName?`<small class="tm-pic-indicator">👤 PIC: ${esc(picName)}${watchAll&&!itemCan?' · hanya pantau':''}</small>`:''}${ok?`<small>✓ ${isRack?'Seluruh rak terjadwal':isMap?'Semua foto petugas sudah masuk':'Selesai oleh '+esc(memberName(log?.completed_by))+' · '+esc(niceTime(log?.completed_at))}</small>`:''}${photoRequired&&!hasValidShiftPhoto(log)?'<small style="color:#bc6b25">Wajib foto kamera + timestamp</small>':''}</div></div>
    ${isRack?rackProgressDetails(s):isMap?mapProgressDetails(s):`<div class="shift-item-footer"><button type="button" class="shift-upload ${!itemCan?'disabled':''}" data-action="camera-open" data-kind="shift" data-id="${esc(key)}" ${!itemCan?'disabled':''}>📷 Ambil foto bukti + timestamp</button><span>${proofs.length} bukti</span>${proofs.map(p=>`<button class="shift-proof-btn" type="button" data-action="shift-open-proof" data-id="${esc(p.id)}">📎 ${esc(p.file_name)}</button>${p.mime_type?.startsWith('image/')?photoAuditBadge(p):''}`).join('')}</div>`}
    ${key==='general-cleaning'?`<div class="shift-note">${key==='map-do-it'?'Rak hari ini':'Area / jadwal GC'}: <input class="field" value="${esc(log?.note||'')}" data-shift-note="${esc(key)}" placeholder="${key==='map-do-it'?'Contoh: Rak minuman A3':'Contoh: GC gudang sesuai jadwal'}" ${!can?'disabled':''}><button class="btn soft sm" data-action="shift-save-note" data-id="${esc(key)}" ${!can?'disabled':''}>Simpan</button></div>`:''}
    </div>`}).join('')}</section>`}).join('')||'<div class="panel"><p class="small muted">Tidak ada pekerjaan pada filter ini.</p></div>'}</div>
 <aside class="shift-side"><div class="panel"><h3>👥 Jadwal Shift ${s}</h3><p class="small muted" style="margin:8px 0 13px">${esc(day)} · hanya petugas yang sedang bertugas menjadi target push.</p>
 ${work.length?work.map(r=>`<div class="shift-roster-row"><div><strong>${esc(memberName(r.user_id))}</strong><small>${esc(new Date(r.start_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))} – ${esc(new Date(r.end_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</small></div>${isAdmin()?`<button class="btn danger sm" data-action="shift-remove-roster" data-id="${esc(r.id)}">Hapus</button>`:''}</div>`).join(''):`<p class="small muted">Belum ada petugas terjadwal.</p>`}
 ${isAdmin()?`<form id="shift-roster-form" class="shift-roster-form"><div class="form-grp"><label>Anggota</label><select class="field" name="user_id" required>${state.members.filter(m=>m.status==='approved'||state.mode==='demo').map(m=>`<option value="${esc(m.user_id)}">${esc(memberName(m.user_id))}</option>`).join('')}</select></div><div class="form-grp"><label>Mulai (tanggal & jam)</label><input class="field" type="datetime-local" name="start_at" required></div><div class="form-grp"><label>Selesai (tanggal & jam)</label><input class="field" type="datetime-local" name="end_at" required></div><button type="submit" class="btn primary block">＋ Simpan jadwal Shift ${s}</button><p class="small muted">Tanggal kerja: <b>${esc(day)}</b>. Shift 3 dimulai pukul 21.30 tanggal ini dan selesai pukul 07.00 keesokan harinya.</p></form>`:''}</div>
 <div class="panel"><h3>▥ Tanggung jawab rak</h3><p class="small muted" style="margin:9px 0 11px">Satu rak dapat ditugaskan ke satu atau beberapa petugas. Setiap PIC ceklis raknya secara terpisah saat masuk shift.</p>
 ${state.rackAssignments.filter(r=>r.is_active!==false).length?`<details class="tm-rack-directory-details"><summary><span>▤ Lihat ${state.rackAssignments.filter(r=>r.is_active!==false).length} rak aktif</span><small>Ketuk untuk tampilkan daftar</small></summary><div class="rack-directory">${state.rackAssignments.filter(r=>r.is_active!==false).map(r=>`<div class="rack-directory-row"><div><strong>${esc(r.rack_name)}</strong><small>${esc(memberName(r.user_id))}</small></div>${isAdmin()?`<button class="btn ghost sm" data-action="shift-rack-deactivate" data-id="${esc(r.id)}">Nonaktif</button>`:''}</div>`).join('')}</div></details>`:'<p class="small muted">Daftar rak belum dimasukkan.</p>'}
 ${isAdmin()?`<form id="rack-assign-form" class="shift-roster-form"><div class="form-grp"><label>PIC / karyawan</label><select class="field" name="user_id" required>${state.members.filter(m=>m.status==='approved'||state.mode==='demo').map(m=>`<option value="${esc(m.user_id)}">${esc(memberName(m.user_id))}</option>`).join('')}</select></div><div class="form-grp"><label>Nama rak / kode rak</label><input class="field" name="rack_name" maxlength="100" placeholder="Contoh: Rak A1 – snack" required></div><button class="btn primary block" type="submit">＋ Tambah tanggung jawab rak</button><p class="small muted">Daftar resmi November 2026 sudah tersedia di panel pemetaan akun.</p></form>`:''}</div>
 ${staffLinkPanel()}
 <div class="panel"><h3>🔔 Push reminder shift</h3><p class="small muted" style="margin:10px 0">Petugas aktif menerima pengingat saat shift dimulai dan tiap 2 jam selama masih ada checklist yang belum selesai.</p><button class="btn primary block" data-action="enable-push">Aktifkan push di HP ini</button><button class="btn soft block" style="margin-top:8px" data-action="shift-test-alarm">🔊 Tes suara alarm</button><p class="small muted" style="margin-top:10px">Push saat aplikasi tertutup memerlukan Supabase, HTTPS, VAPID dan server cron. Ini bukan alarm sistem yang berbunyi terus-menerus.</p></div></aside></div>`;
}
async function afterShiftMutation(){if(state.mode==='demo'){persistShiftDemo();render()}else{await loadShiftCloud();render()}}
async function ensureShiftLog(key){
 if(!shiftItemsFor(state.shiftNumber).some(i=>i[0]===key))throw new Error('Pekerjaan tidak dikenal / diarsipkan');
 let old=shiftLog(key);if(old)return old;
 const v={workspace_id:state.workspace.id,work_date:cleanShiftDate(),shift_number:state.shiftNumber,item_key:key,is_checked:false,note:''};
 if(state.mode==='demo'){old={id:uid(),...v};state.shiftLogs.push(old);persistShiftDemo();return old}
 const {data,error}=await state.db.from('shift_logs').upsert(v,{onConflict:'workspace_id,work_date,shift_number,item_key',ignoreDuplicates:true}).select().maybeSingle();
 if(error)throw error;
 if(data)return data;
 const r=await state.db.from('shift_logs').select('*').eq('workspace_id',v.workspace_id).eq('work_date',v.work_date).eq('shift_number',v.shift_number).eq('item_key',key).single();if(r.error)throw r.error;return r.data;
}
async function toggleShiftCheck(key,checked){
 if(!shiftItemsFor(state.shiftNumber).some(i=>i[0]===key))throw new Error('Checklist tidak sesuai shift');
 if(['sisir-harga','map-do-it'].includes(key))throw new Error('Pekerjaan ini selesai otomatis setelah semua foto dan ceklis per petugas lengkap.');
 if(!canPerformShiftItem(key))throw new Error('Tugas ini belum ditugaskan kepada akun Anda.');
 const old=await ensureShiftLog(key);
 if(photoRequiredFor(key)&&checked&&!hasValidShiftPhoto(old))throw new Error('Ambil foto dari kamera aplikasi terlebih dahulu untuk menyelesaikan pekerjaan ini.');
 const val={is_checked:checked,completed_at:checked?new Date().toISOString():null,completed_by:checked?state.user.id:null};
 if(state.mode==='demo')Object.assign(old,val);
 else{const {error}=await state.db.from('shift_logs').update(val).eq('id',old.id);if(error)throw error}
 await afterShiftMutation();notify(checked?'Pekerjaan dicentang selesai':'Pekerjaan dikembalikan belum selesai');
}
async function saveShiftNote(key,note){
 if(!['map-do-it','general-cleaning'].includes(key))throw new Error('Pekerjaan ini tidak memerlukan catatan');
 if(!canPerformShiftItem(key))throw new Error('Tugas ini bukan tugas PIC Anda.');
 const old=await ensureShiftLog(key),val=String(note||'').trim().slice(0,300);
 if(state.mode==='demo')old.note=val;
 else{const r=await state.db.from('shift_logs').update({note:val}).eq('id',old.id);if(r.error)throw r.error}
 await afterShiftMutation();notify('Catatan pekerjaan disimpan');
}
async function uploadShiftProof(key,files,capturedAt=null){
 if(!(capturedAt instanceof Date)||!Number.isFinite(capturedAt.getTime()))throw new Error('Foto shift wajib diambil dari kamera aplikasi.');
 if(!files?.length)return;
 if(!canPerformShiftItem(key))throw new Error('Bukti hanya boleh diunggah oleh PIC tugas ini.');
 const valid=['image/jpeg','image/png','image/webp','image/heic','application/pdf'],old=await ensureShiftLog(key);let count=0;
 const itemTitle=shiftItemTitle(key,state.shiftNumber);
 for(const file of [...files]){
  if(!valid.includes(file.type)||file.size>10*1024*1024){notify('Gunakan JPG, PNG, WebP, HEIC atau PDF maks. 10 MB',true);continue}
  if(key==='foto-selisih'&&!file.type.startsWith('image/')){notify('Ceklis foto cetak selisih hanya menerima bukti berupa foto.',true);continue}
  const isImage=file.type.startsWith('image/')&&file.type!=='image/heic';
  const meta={userName:currentUserName(),shiftNumber:state.shiftNumber,itemLabel:itemTitle,areaLabel:'Checklist Shift',now:capturedAt};
  if(state.mode==='demo'){
   if(!isImage){notify('Demo hanya mendukung foto JPG, PNG atau WebP.',true);continue}
   const stamped=await watermarkedImage(file,meta);state.shiftProofs.push({id:uid(),log_id:old.id,file_name:stamped.fileName,data_url:stamped.dataUrl,uploaded_by:state.user.id,mime_type:'image/jpeg',client_captured_at:capturedAt.toISOString(),created_at:new Date().toISOString()});count++;
  }else{
   const payload=isImage?await watermarkedImage(file,meta):{blob:file,mimeType:file.type,fileName:file.name};
   const fname=(payload.fileName||file.name).replace(/[^a-zA-Z0-9_.-]/g,'_').slice(-85),path=`${state.workspace.id}/${old.id}/${uid()}-${fname}`;
   const up=await state.db.storage.from('shift-evidence').upload(path,payload.blob,{contentType:payload.mimeType,upsert:false});if(up.error)throw up.error;
   const r=await state.db.from('shift_evidence').insert({log_id:old.id,object_path:path,file_name:payload.fileName||file.name,mime_type:payload.mimeType||file.type,uploaded_by:state.user.id,client_captured_at:capturedAt.toISOString()});
   if(r.error){await state.db.storage.from('shift-evidence').remove([path]);throw r.error}count++;
  }
 }
 if(count){await afterShiftMutation();notify(`${count} bukti Shift ${state.shiftNumber} berhasil diunggah dengan timestamp`)}
}
async function openShiftProof(id){const p=state.shiftProofs.find(x=>x.id===id);if(!p)return;
 if(state.mode==='demo'){if(p.data_url)window.open(p.data_url,'_blank');return}
 const tab=window.open('about:blank','_blank'),r=await state.db.storage.from('shift-evidence').createSignedUrl(p.object_path,120);if(r.error){tab?.close();throw r.error}if(tab)tab.location.href=r.data.signedUrl;
}
async function hydrateShiftThumbs(){ /* Buka file dengan signed URL saat pengguna menekan lampiran. */ }
async function saveShiftRoster(form){
 if(!isAdmin())throw new Error('Hanya admin yang dapat mengatur shift');
 const fd=new FormData(form),userId=String(fd.get('user_id')||''),start=new Date(String(fd.get('start_at'))),end=new Date(String(fd.get('end_at')));
 if(!state.members.some(m=>m.user_id===userId&&(m.status==='approved'||state.mode==='demo')))throw new Error('Anggota belum disetujui');
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end-start>20*3600000)throw new Error('Jam selesai harus setelah jam mulai, durasi maksimum 20 jam.');
 const v={workspace_id:state.workspace.id,user_id:userId,shift_number:state.shiftNumber,work_date:cleanShiftDate(),start_at:start.toISOString(),end_at:end.toISOString()};
 if(state.mode==='demo'){state.shiftRoster=state.shiftRoster.filter(r=>!(r.user_id===userId&&r.work_date===v.work_date&&r.shift_number===v.shift_number));state.shiftRoster.push({id:uid(),...v})}
 else{const r=await state.db.from('shift_roster').upsert(v,{onConflict:'workspace_id,work_date,shift_number,user_id'});if(r.error)throw r.error}
 await afterShiftMutation();notify(`Jadwal Shift ${state.shiftNumber} disimpan`);
}
async function removeShiftRoster(id){if(!isAdmin())throw new Error('Hanya admin yang dapat menghapus jadwal');if(!confirm('Hapus jadwal petugas ini?'))return;
 if(state.mode==='demo')state.shiftRoster=state.shiftRoster.filter(r=>r.id!==id);
 else{const r=await state.db.from('shift_roster').delete().eq('id',id);if(r.error)throw r.error}
 await afterShiftMutation();notify('Jadwal berhasil dihapus');
}
async function saveRackAssignment(form){
 if(!isAdmin())throw new Error('Hanya admin yang dapat menentukan rak tanggung jawab');
 const fd=new FormData(form),userId=String(fd.get('user_id')||''),rackName=String(fd.get('rack_name')||'').trim().slice(0,100);
 if(!state.members.some(m=>m.user_id===userId&&(m.status==='approved'||state.mode==='demo')))throw new Error('Pilih anggota tim yang sudah disetujui');
 if(!rackName)throw new Error('Masukkan nama rak');
 const old=state.rackAssignments.find(x=>x.user_id===userId&&x.rack_name.toLowerCase()===rackName.toLowerCase()&&x.is_active!==false);
 if(old)throw new Error('PIC ini sudah memiliki rak yang sama');
 const v={workspace_id:state.workspace.id,user_id:userId,rack_name:rackName,is_active:true};
 if(state.mode==='demo')state.rackAssignments.push({id:uid(),...v});
 else{const r=await state.db.from('shift_rack_assignments').upsert(v,{onConflict:'workspace_id,user_id,rack_name'});if(r.error)throw r.error}
 await afterShiftMutation();notify('Tanggung jawab rak berhasil ditambahkan');
}
async function deactivateRack(id){
 if(!isAdmin())throw new Error('Hanya admin dapat menonaktifkan rak');
 if(!confirm('Nonaktifkan tanggung jawab rak ini? Histori ceklis tetap tersimpan.'))return;
 if(state.mode==='demo'){const r=state.rackAssignments.find(x=>x.id===id);if(r)r.is_active=false}
 else{const r=await state.db.from('shift_rack_assignments').update({is_active:false}).eq('id',id);if(r.error)throw r.error}
 await afterShiftMutation();notify('Tanggung jawab rak dinonaktifkan');
}
function validateExtraPhoto(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Pilih foto JPG, PNG, atau WebP.');
 if(file.size>8*1024*1024)throw new Error('Foto maksimal 8 MB. Kompres atau ambil ulang foto.');
}
function extraPath(kind,userId,file){
 const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
 return `${state.workspace.id}/${kind}/${userId}/${cleanShiftDate()}/${state.shiftNumber}/${uid()}.${ext}`;
}
async function uploadRackPhoto(id,files,capturedAt=null){
 if(!(capturedAt instanceof Date)||!Number.isFinite(capturedAt.getTime()))throw new Error('Foto rak wajib diambil dari kamera aplikasi.');
 const f=files?.[0];if(!f)return;validateExtraPhoto(f);
 const r=state.rackAssignments.find(x=>x.id===id&&x.is_active!==false);
 if(!r||!shiftScheduled().some(x=>x.user_id===r.user_id))throw new Error('Rak tidak terdaftar pada shift ini.');
 if(!shiftCanCheck()||(state.mode!=='demo'&&!isAdmin()&&r.user_id!==state.user?.id))throw new Error('Hanya PIC rak atau admin yang boleh mengunggah foto.');
 const stamped=await watermarkedImage(f,{userName:currentUserName(),shiftNumber:state.shiftNumber,itemLabel:`Rak ${r.rack_name}`,areaLabel:`Sisir harga • PIC ${memberName(r.user_id)}`,now:capturedAt});
 const v={workspace_id:state.workspace.id,work_date:cleanShiftDate(),shift_number:state.shiftNumber,assignment_id:r.id,user_id:r.user_id,uploaded_by:state.user.id,file_name:stamped.fileName,mime_type:'image/jpeg',ai_status:'unavailable',ai_note:'',client_captured_at:capturedAt.toISOString()};
 if(state.mode==='demo'){
  state.rackPhotos.push({id:uid(),...v,data_url:stamped.dataUrl,created_at:new Date().toISOString()});
  const check=rackCheck(id);if(check){check.is_checked=false;check.manual_note='';check.completed_at=null;check.completed_by=null;}
  await afterShiftMutation();notify(`Rak ${r.rack_name}: foto kamera + crop + timestamp tersimpan. Periksa lalu centang.`);return;
 }
 if(state.photoSetupError)throw new Error(state.photoSetupError);
 const path=extraPath('rack',r.user_id,{type:'image/jpeg'});
 const up=await state.db.storage.from('shift-extra-evidence').upload(path,stamped.blob,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
 const ins=await state.db.from('shift_rack_photos').insert({...v,object_path:path}).select().single();
 if(ins.error){await state.db.storage.from('shift-extra-evidence').remove([path]);throw ins.error}
 const check=rackCheck(id);if(check){const reset=await state.db.from('shift_rack_checks').update({is_checked:false,completed_at:null,completed_by:null,manual_note:''}).eq('id',check.id);if(reset.error)throw reset.error}
 await afterShiftMutation();notify(`Rak ${r.rack_name}: foto tersimpan di cloud. Periksa label harga secara langsung lalu centang selesai.`);
}

async function uploadMapPhoto(userId,files,capturedAt=null){
 if(!(capturedAt instanceof Date)||!Number.isFinite(capturedAt.getTime()))throw new Error('Foto Map Do It wajib diambil dari kamera aplikasi.');
 const f=files?.[0];if(!f)return;validateExtraPhoto(f);
 const scheduled=shiftScheduled().some(r=>r.user_id===userId);
 if(!scheduled)throw new Error('Karyawan tidak masuk shift yang dipilih.');
 if(!shiftCanCheck()||(state.mode!=='demo'&&!isAdmin()&&state.user?.id!==userId))throw new Error('Hanya petugas tersebut atau admin yang dapat mengirim foto.');
 const note=String(document.querySelector(`[data-map-note="${userId}"]`)?.value||'').trim().slice(0,100);
 if(note.length<2)throw new Error('Isi kode/nama rak yang dikerjakan sebelum upload Map Do It.');
 const old=mapPhotoFor(userId);
 const stamped=await watermarkedImage(f,{userName:currentUserName(),shiftNumber:state.shiftNumber,itemLabel:'Map Do It',areaLabel:`Rak ${note} • PIC ${memberName(userId)}`,now:capturedAt});
 const v={workspace_id:state.workspace.id,work_date:cleanShiftDate(),shift_number:state.shiftNumber,user_id:userId,uploaded_by:state.user.id,rack_note:note,file_name:stamped.fileName,mime_type:'image/jpeg',client_captured_at:capturedAt.toISOString()};
 if(state.mode==='demo'){
  const obj={id:old?.id||uid(),...v,data_url:stamped.dataUrl,created_at:new Date().toISOString()};
  state.mapPhotos=state.mapPhotos.filter(x=>!(x.work_date===v.work_date&&x.shift_number===v.shift_number&&x.user_id===v.user_id));state.mapPhotos.push(obj);
  await afterShiftMutation();notify(`Map Do It ${memberName(userId)}: foto + timestamp diterima`);return;
 }
 if(state.photoSetupError)throw new Error(state.photoSetupError);
 const path=extraPath('map',userId,{type:'image/jpeg'}),up=await state.db.storage.from('shift-extra-evidence').upload(path,stamped.blob,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
 const ins=await state.db.from('shift_map_photos').upsert({...v,object_path:path},{onConflict:'workspace_id,work_date,shift_number,user_id'}).select().single();
 if(ins.error){await state.db.storage.from('shift-extra-evidence').remove([path]);throw ins.error}
 if(old?.object_path)await state.db.storage.from('shift-extra-evidence').remove([old.object_path]);
 await afterShiftMutation();notify(`Map Do It: ${mapProgress().done}/${mapProgress().total} petugas sudah upload foto`);
}
async function openExtraProof(kind,id){
 const photo=kind==='rack'?state.rackPhotos.find(p=>p.id===id):kind==='map'?state.mapPhotos.find(p=>p.id===id):null;
 if(!photo)return;
 if(state.mode==='demo'){if(photo.data_url)window.open(photo.data_url,'_blank','noopener');return}
 const tab=window.open('about:blank','_blank'),res=await state.db.storage.from('shift-extra-evidence').createSignedUrl(photo.object_path,120);
 if(res.error){tab?.close();throw res.error}
 if(tab)tab.location.href=res.data.signedUrl;
}
async function toggleRackCheck(id,checked){
 if(state.rackError)throw new Error(state.rackError);
 const r=state.rackAssignments.find(x=>x.id===id&&x.is_active!==false);
 if(!r||!shiftScheduled().some(x=>x.user_id===r.user_id))throw new Error('Rak bukan bagian dari petugas yang masuk shift ini.');
 if(!shiftCanCheck()||(state.mode!=='demo'&&!isAdmin()&&state.user?.id!==r.user_id))throw new Error('Hanya PIC rak atau admin yang dapat menceklis.');
 const photo=latestRackPhoto(id);if(checked&&!photo?.client_captured_at)throw new Error('Foto rak v7 wajib diambil ulang dari kamera sebelum checklist.');
 let manual='';
 if(checked){
  const confirmed=confirm(`Apakah Anda telah memeriksa LANGSUNG seluruh label harga di rak ${r.rack_name}, dan memastikan tidak ada label yang belum diperbaiki? Pilih OK jika benar-benar sudah selesai.`);
  if(!confirmed)throw new Error('Checklist belum ditandai. Periksa dan perbaiki label harga dahulu.');
  manual='PIC mengonfirmasi pemeriksaan langsung seluruh label harga rak.';
 }
 const v={workspace_id:state.workspace.id,work_date:cleanShiftDate(),shift_number:state.shiftNumber,assignment_id:id,user_id:r.user_id,is_checked:checked,completed_at:checked?new Date().toISOString():null,completed_by:checked?state.user.id:null,manual_note:checked?manual:''};
 if(state.mode==='demo'){let old=rackCheck(id);if(old)Object.assign(old,v);else state.rackChecks.push({id:uid(),...v})}
 else{const res=await state.db.from('shift_rack_checks').upsert(v,{onConflict:'workspace_id,work_date,shift_number,assignment_id'});if(res.error)throw res.error}
 await afterShiftMutation();notify(checked?'Rak selesai, foto dan konfirmasi manual tercatat di cloud.':'Checklist harga rak dibatalkan.');
}
function urlBase64ToUint8Array(base64){const pad='='.repeat((4-base64.length%4)%4),raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function enableShiftPush(){
 if(state.mode!=='cloud'){notify('Hubungkan Supabase dan hosting HTTPS sebelum mengaktifkan push.',true);return}
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)||location.protocol!=='https:'){notify('Push perlu HTTPS dan browser yang mendukung Web Push.',true);return}
 const publicKey=String(window.TASKMATE_CONFIG?.vapidPublicKey||'').trim();if(!publicKey){notify('Isi vapidPublicKey di config.js terlebih dahulu.',true);return}
 const perm=await Notification.requestPermission();if(perm!=='granted'){notify('Izin notifikasi ditolak.',true);return}
 const reg=await navigator.serviceWorker.ready;
 let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)});
 const {error}=await state.db.from('shift_push_subscriptions').upsert({workspace_id:state.workspace.id,user_id:state.user.id,endpoint:sub.endpoint,subscription:sub.toJSON()},{onConflict:'endpoint'});if(error)throw error;
 notify('HP ini sudah terdaftar untuk push. Notifikasi hanya dikirim saat Anda sedang masuk shift.');
}
async function testAlarm(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(Audio){const ctx=new Audio(),now=ctx.currentTime;for(let i=0;i<3;i++){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=i%2?880:660;osc.connect(gain);gain.connect(ctx.destination);gain.gain.setValueAtTime(0,now+i*.28);gain.gain.linearRampToValueAtTime(.13,now+i*.28+.025);gain.gain.setValueAtTime(.13,now+i*.28+.18);gain.gain.linearRampToValueAtTime(0,now+i*.28+.22);osc.start(now+i*.28);osc.stop(now+i*.28+.23)}setTimeout(()=>ctx.close().catch(()=>{}),1300)}
 if(typeof Notification!=='undefined'&&Notification.permission==='granted')try{new Notification(`🔔 Tes alarm Shift ${state.shiftNumber}`,{body:'Alarm uji coba di HP ini, tidak dikirim ke anggota tim.',icon:'./icons/icon-192.png'})}catch{}
 notify('Tes suara dijalankan; suara push sebenarnya mengikuti pengaturan HP.');
}
function exportShiftCSV(allShifts=false){
 const rows=[['Tanggal kerja','Shift','Area','Pekerjaan','Status','Selesai oleh','Waktu ceklis','Jumlah bukti','Catatan','Waktu foto HP','Waktu diterima server','Status audit foto']];
 for(const s of (allShifts?shiftNumbers:[state.shiftNumber])){
  for(const area of shiftAreasFor(s))for(const [key,title] of area.items){
   const l=shiftLog(key,s),isRack=key==='sisir-harga',r=isRack?rackProgress(s):null;
   rows.push([cleanShiftDate(),s,area.name,title,shiftItemDone(key,s)?'Selesai':'Belum',isRack?'Per PIC':l?.is_checked?memberName(l.completed_by):'',l?.completed_at?niceTime(l.completed_at):'',isRack?r.photos:key==='map-do-it'?mapProgress(s).done:shiftProofList(l).length,isRack?`${r.done}/${r.total} rak; ${r.photos} foto; verifikasi manual`:key==='map-do-it'?`${mapProgress(s).done}/${mapProgress(s).total} foto PIC`:l?.note||'']);
   if(isRack)for(const rack of rackListForShift(s)){const c=rackCheck(rack.id,s),p=latestRackPhoto(rack.id,s);rows.push([cleanShiftDate(),s,'Sisir harga per PIC',rack.rack_name,rackCheckedWithPhoto(rack,s)?'Selesai':'Belum',memberName(rack.user_id),c?.completed_at?niceTime(c.completed_at):'',rackPhotosFor(rack.id,s).length,c?.manual_note||'Belum dikonfirmasi',p?.client_captured_at||'',p?.server_received_at||'',p?.client_captured_at?(p?.server_received_at?'Waktu tercatat server':'Demo/waktu HP'):'Bukti lama/perlu foto ulang']);}
  }
  for(const oldLog of state.shiftLogs.filter(l=>l.shift_number===s&&l.work_date===cleanShiftDate()&&!shiftItemsFor(s).some(i=>i[0]===l.item_key))){rows.push([cleanShiftDate(),s,'Arsip','Pekerjaan lama: '+oldLog.item_key,oldLog.is_checked?'Selesai':'Belum',oldLog.completed_by?memberName(oldLog.completed_by):'',oldLog.completed_at?niceTime(oldLog.completed_at):'',shiftProofList(oldLog).length,'Poin sudah diarsipkan; riwayat dipertahankan']);}
  for(const person of shiftScheduled(s)){const photo=mapPhotoFor(person.user_id,s);rows.push([cleanShiftDate(),s,'Map Do It per PIC',photo?.rack_note||'Belum diisi',photo?.client_captured_at?'Foto terkirim':'Belum',memberName(person.user_id),photo?.server_received_at?niceTime(photo.server_received_at):'',photo?.client_captured_at?1:0,'1 foto kamera wajib per orang',photo?.client_captured_at||'',photo?.server_received_at||'',photo?.client_captured_at?(photo?.server_received_at?'Waktu tercatat server':'Demo/waktu HP'):'Bukti lama/perlu foto ulang']);}
 }
 const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`TaskMate-${allShifts?'Semua-Shift':'Shift-'+state.shiftNumber}-${cleanShiftDate()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);notify('Rekap checklist berhasil diekspor');
}

start().catch(showError);
})();
