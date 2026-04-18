import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://syycxtgoojruprqgdjpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eWN4dGdvb2pydXBycWdkanBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTY3ODIsImV4cCI6MjA5MDEzMjc4Mn0.9afw21pXlWHFXXq69jdXAQA0rn0UF04DGWcrB-S3a7s";

const sb = async (path, opts = {}) => {
  const token = opts.token || SUPABASE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": opts.prefer || "return=representation", ...opts.headers },
    ...opts,
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || res.statusText); }
  const t = await res.text(); return t ? JSON.parse(t) : null;
};

const sbAuth = async (endpoint, body) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method:"POST", headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"}, body:JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error_description || d.msg || "Erreur");
  return d;
};

const compressImage = (b64, maxW=1200, q=0.78) => new Promise(res => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, maxW/img.width);
    const c = document.createElement("canvas");
    c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    res(c.toDataURL("image/jpeg",q));
  };
  img.src = b64;
});

const uploadPhoto = async (b64, path, token) => {
  const comp = await compressImage(b64);
  const bytes = Uint8Array.from(atob(comp.split(",")[1]), c=>c.charCodeAt(0));
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method:"POST", headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${token||SUPABASE_KEY}`,"Content-Type":"image/jpeg"}, body:bytes,
  });
  if (!res.ok) throw new Error("Erreur upload");
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
};

const tags = ["Tout","Livres & Cours","Electronique","Vetements","Services","Autre"];
const emptyForm = {type:"product",title:"",price:"",tag:"Livres & Cours",condition:"",description:"",ville:"",quartier:"",photos:[]};
const emptyReg = {nom:"",prenom:"",dateNaissance:"",sexe:"",filiere:"",annee:"",telephone:"",photo:null,photoFile:null,email:"",password:"",confirmPassword:""};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }
  html, body { width:100%; max-width:100%; overflow-x:hidden; margin:0; padding:0; }
  body { font-family:'Inter',sans-serif; background:white; margin:0; padding:0; }
  img { max-width:100%; display:block; }
  input,select,textarea,button { font-family:'Inter',sans-serif; }

  /* Buttons */
  .btn { display:inline-block; border:none; border-radius:4px; cursor:pointer; font-weight:600; font-size:14px; padding:11px 20px; transition:background 0.15s; text-align:center; }
  .btn-red { background:#C8102E; color:white; }
  .btn-red:hover { background:#a00d24; }
  .btn-red:disabled { opacity:0.7; cursor:not-allowed; }
  .btn-white { background:white; color:#111; border:1px solid #d5d9d9; }
  .btn-white:hover { background:#f7f8f8; }
  .btn-block { display:block; width:100%; }

  /* Inputs */
  .inp { width:100%; padding:11px 12px; border:1px solid #adb1b8; border-radius:4px; font-size:14px; outline:none; background:white; color:#111; transition:border 0.15s,box-shadow 0.15s; }
  .inp:focus { border-color:#C8102E; box-shadow:0 0 0 3px rgba(200,16,46,0.08); }
  .inp.err { border-color:#C8102E; background:#fff8f8; }
  .lbl { font-size:12px; font-weight:600; color:#444; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.4px; }
  .lbl-opt::after { content:" (optionnel)"; font-weight:400; color:#999; text-transform:none; }
  .err-box { background:#fff3f3; border:1px solid #f5c6cb; border-radius:4px; padding:10px 14px; font-size:13px; color:#C8102E; }
  .ok-box { background:#f0faf0; border:1px solid #b3dfb3; border-radius:4px; padding:10px 14px; font-size:13px; color:#2d7a2d; }

  /* Auth pages — mobile first */
  .auth-page { min-height:100vh; width:100%; background:#f3f3f3; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; }
  .auth-card { width:100%; min-height:100vh; max-width:100%; background:white; display:flex; flex-direction:column; }
  .auth-left { display:none; }
  .auth-body { flex:1; padding:28px 20px; display:flex; flex-direction:column; justify-content:center; overflow-y:auto; max-width:460px; width:100%; margin:0 auto; }
  .form-2col { display:grid; grid-template-columns:1fr; gap:14px; }
  .sexe-btn { flex:1; padding:11px; border-radius:4px; cursor:pointer; font-weight:500; font-size:14px; border:1px solid #adb1b8; background:white; color:#333; transition:all 0.15s; }
  .sexe-btn.on { background:#C8102E; color:white; border-color:#C8102E; }
  .a-link { color:#C8102E; cursor:pointer; font-weight:600; font-size:14px; background:none; border:none; text-decoration:underline; }

  /* Nav */
  .nav-btn { padding:7px 14px; border-radius:3px; cursor:pointer; font-weight:500; font-size:13px; border:none; background:none; color:white; white-space:nowrap; transition:all 0.15s; }
  .nav-btn:hover { background:rgba(255,255,255,0.15); }
  .nav-btn.on { background:white; color:#C8102E; }

  /* Cards grid — 2 cols mobile */
  .cards-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
  @media (max-width:380px) { .cards-grid { grid-template-columns:1fr; } }
  .card { background:white; border:1px solid #ddd; border-radius:6px; overflow:hidden; cursor:pointer; transition:box-shadow 0.15s; }
  .card:hover { box-shadow:0 2px 14px rgba(0,0,0,0.12); }

  /* Modals — bottom sheet mobile */
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.52); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  .modal { background:white; border-radius:16px 16px 0 0; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; }
  .modal-handle { width:38px; height:4px; background:#ddd; border-radius:2px; margin:10px auto 6px; flex-shrink:0; }
  .tab-btn { flex:1; padding:13px; border:none; background:none; cursor:pointer; font-weight:600; font-size:14px; border-bottom:2px solid transparent; color:#888; transition:all 0.15s; }
  .tab-btn.on { color:#C8102E; border-bottom-color:#C8102E; }

  /* Sidebar — bottom sheet mobile */
  .sidebar { position:fixed; bottom:0; left:0; right:0; max-height:88vh; background:white; border-radius:16px 16px 0 0; z-index:300; padding:0 20px 24px; overflow-y:auto; }
  .sidebar-handle { width:38px; height:4px; background:#ddd; border-radius:2px; margin:12px auto 18px; }

  /* Dropdown */
  .dropdown { position:relative; }
  .dd-menu { position:absolute; top:calc(100% + 8px); right:0; background:white; border:1px solid #eee; border-radius:6px; box-shadow:0 4px 20px rgba(0,0,0,0.14); min-width:185px; z-index:150; overflow:hidden; }
  .dd-item { display:flex; align-items:center; gap:10px; padding:12px 16px; font-size:14px; color:#111; cursor:pointer; border:none; background:none; width:100%; text-align:left; transition:background 0.12s; }
  .dd-item:hover { background:#f5f5f5; }
  .dd-item.red { color:#C8102E; }
  .dd-sep { height:1px; background:#f0f0f0; margin:4px 0; }

  /* Messages */
  .msg-me { background:#C8102E; color:white; border-radius:16px 16px 4px 16px; padding:10px 14px; font-size:14px; max-width:78%; line-height:1.5; word-break:break-word; }
  .msg-other { background:#f0f0f0; color:#111; border-radius:16px 16px 16px 4px; padding:10px 14px; font-size:14px; max-width:78%; line-height:1.5; word-break:break-word; }
  .conv-row { display:flex; align-items:center; gap:12px; padding:13px 14px; cursor:pointer; border-bottom:1px solid #f5f5f5; transition:background 0.15s; }
  .conv-row:hover { background:#fafafa; }
  .conv-row.on { background:#fff5f5; border-left:3px solid #C8102E; }
  .msg-inp { flex:1; padding:11px 14px; border:1px solid #ddd; border-radius:22px; font-size:14px; outline:none; resize:none; }
  .msg-inp:focus { border-color:#C8102E; }

  /* Photos */
  .photo-drop { border:2px dashed #d5d9d9; border-radius:6px; padding:22px 16px; text-align:center; cursor:pointer; transition:border-color 0.15s; }
  .photo-drop:hover { border-color:#C8102E; background:#fff8f8; }
  .photo-thumb { position:relative; width:76px; height:76px; border-radius:4px; overflow:hidden; border:1px solid #ddd; flex-shrink:0; }
  .photo-thumb img { width:100%; height:100%; object-fit:cover; }
  .photo-del { position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.65); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; }

  /* Misc */
  .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; margin-right:6px; vertical-align:middle; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  .marquee { display:flex; white-space:nowrap; animation:marquee 28s linear infinite; }
  .marquee:hover { animation-play-state:paused; }
  .hero-inner { display:flex; flex-direction:column; }
  .hero-features { display:none !important; }
  .hero-text { flex:1; min-width:0; width:100%; max-width:100%; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:#C8102E; border-radius:2px; }

  /* ── DESKTOP >= 768px ── */
  @media (min-width:768px) {
    .auth-page { align-items:center; padding:24px; min-height:100vh; }
    .auth-card { min-height:auto; max-width:860px; flex-direction:row; border-radius:8px; box-shadow:0 2px 24px rgba(0,0,0,0.10); overflow:hidden; width:100%; }
    .auth-left { display:flex; width:36%; background:#C8102E; padding:48px 36px; flex-direction:column; justify-content:center; flex-shrink:0; }
    .auth-body { padding:48px 44px; max-width:none; margin:0; }
    .form-2col { grid-template-columns:1fr 1fr; }
    .overlay { align-items:center; padding:20px; }
    .modal { border-radius:6px; max-width:580px; max-height:90vh; }
    .modal-handle { display:none; }
    .sidebar { position:fixed; bottom:auto; left:auto; right:0; top:0; height:100vh; width:360px; border-radius:0; padding:24px; }
    .sidebar-handle { display:none; }
    .cards-grid { grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
    .hdr-search { display:flex !important; }
    .mob-search { display:none !important; }
    .hero-features { display:flex !important; }
    .hero-inner { flex-direction:row; }
  }
`;

/* ── LEFT PANEL ── */
const LeftPanel = () => (
  <div className="auth-left">
    <div style={{color:"white"}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:2.5,textTransform:"uppercase",opacity:0.75,marginBottom:12}}>Bienvenue sur</div>
      <div style={{fontSize:26,fontWeight:700,lineHeight:1.25,marginBottom:8}}>Faso_Karanbissi</div>
      <div style={{width:36,height:2,background:"rgba(255,255,255,0.4)",marginBottom:20}}/>
      <p style={{fontSize:13,lineHeight:1.8,opacity:0.85,fontWeight:300,marginBottom:28}}>La plateforme qui connecte les étudiants de votre campus pour vendre, acheter et proposer des services.</p>
      {["Vendez vos articles","Proposez vos services","Entraide entre étudiants"].map(item=>(
        <div key={item} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,opacity:0.9,marginBottom:10}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"white",flexShrink:0}}/>{item}
        </div>
      ))}
    </div>
  </div>
);

/* ── SVG ICONS ── */
const Ic = ({n,s=18,c="currentColor"}) => {
  const d = {
    cart:<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
    list:<><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    msg:<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    out:<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chev:<polyline points="6 9 12 15 18 9"/>,
    pin:<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    img:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    del:<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    srch:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    send:<line x1="22" y1="2" x2="11" y2="13"/>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>{d[n]}</svg>;
};

/* ── BADGE ── */
const Badge = ({n,style={}}) => n>0 ? <span style={{background:"#C8102E",color:"white",borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700,...style}}>{n}</span> : null;

export default function App() {
  // page: "guest" | "login" | "register" | "forgot" | "reset" | "marketplace"
  // Navigation avec historique navigateur
  const getInitialPage = () => {
    const p = window.location.pathname.replace("/","") || "guest";
    const valid = ["guest","login","register","forgot","reset","marketplace"];
    return valid.includes(p) ? p : "guest";
  };
  const [page, setPageState] = useState(getInitialPage);

  const setPage = (p) => {
    window.history.pushState({page:p}, "", p === "guest" ? "/" : "/"+p);
    setPageState(p);
  };

  useEffect(() => {
    const onPop = (e) => {
      const p = e.state?.page || window.location.pathname.replace("/","") || "guest";
      setPageState(p);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showDD, setShowDD] = useState(false);

  // Auth
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [regStep, setRegStep] = useState(1);
  const [reg, setReg] = useState(emptyReg);
  const [regErr, setRegErr] = useState({});
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotErr, setForgotErr] = useState("");
  const [forgotOk, setForgotOk] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErr, setResetErr] = useState("");
  const [resetOk, setResetOk] = useState(false);

  // Marketplace
  const [listings, setListings] = useState([]);
  const [loadingL, setLoadingL] = useState(false);
  const [tab, setTab] = useState("all");
  const [tag, setTag] = useState("Tout");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [modal, setModal] = useState(null);
  const [mPhotoIdx, setMPhotoIdx] = useState(0);
  const [mTab, setMTab] = useState("article");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Mes annonces & profil
  const [showMyAds, setShowMyAds] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [profilForm, setProfilForm] = useState(null);
  const [profilLoading, setProfilLoading] = useState(false);
  const [profilOk, setProfilOk] = useState(false);
  const [profilErr, setProfilErr] = useState("");
  const [delConfirm, setDelConfirm] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  // Messagerie
  const [showMsgs, setShowMsgs] = useState(false);
  const [convs, setConvs] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [convMsgs, setConvMsgs] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [contactModal, setContactModal] = useState(null);

  const profileRef = useRef();
  const articleRef = useRef();
  const profilRef = useRef();
  const msgsEndRef = useRef();
  const ddRef = useRef();

  useEffect(() => {
    const h = e => { if (ddRef.current && !ddRef.current.contains(e.target)) setShowDD(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      const p = new URLSearchParams(hash.replace("#","?"));
      const t = p.get("access_token");
      if (t) { setAuthToken(t); setPage("reset"); }
    }
  }, []);

  useEffect(() => { if (page==="guest"||page==="marketplace") fetchListings(); }, [page]);

  useEffect(() => {
    if (page==="marketplace" && user) {
      fetchConvs();
      const iv = setInterval(fetchConvs, 30000);
      return () => clearInterval(iv);
    }
  }, [page, user]);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [convMsgs]);

  useEffect(() => {
    const base = "Faso_Karanbissi";
    if (unread > 0) {
      document.title = `(${unread}) ${base}`;
      const cv = document.createElement("canvas"); cv.width=32; cv.height=32;
      const ctx = cv.getContext("2d");
      ctx.fillStyle="#1B0007"; ctx.beginPath(); ctx.arc(16,16,16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="white"; ctx.font="bold 11px Inter,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("FK",13,16);
      ctx.fillStyle="#C8102E"; ctx.beginPath(); ctx.arc(24,8,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="white"; ctx.font="bold 10px Inter,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(unread>9?"9+":String(unread),24,8);
      let lk = document.querySelector("link[rel~=icon]");
      if (!lk) { lk=document.createElement("link"); lk.rel="icon"; document.head.appendChild(lk); }
      lk.href = cv.toDataURL();
    } else {
      document.title = base;
      const lk = document.querySelector("link[rel~=icon]");
      if (lk) lk.href="/favicon.ico";
    }
  }, [unread]);

  const fetchListings = async () => {
    setLoadingL(true);
    try {
      const rows = await sb("annonces?select=*,utilisateurs(*),photos_annonces(*)&order=created_at.desc");
      setListings(rows.map(a=>({
        id:a.id,type:a.type,title:a.titre,price:a.prix,tag:a.categorie,
        condition:a.condition,description:a.description,ville:a.ville||"",quartier:a.quartier||"",
        photos:(a.photos_annonces||[]).sort((x,y)=>x.ordre-y.ordre).map(p=>p.url),
        seller:a.utilisateurs?{...a.utilisateurs,photo:a.utilisateurs.photo_url}:{},
      })));
    } catch(e){console.error(e);}
    finally{setLoadingL(false);}
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()||!loginPwd.trim()) { setLoginErr("Veuillez remplir tous les champs."); return; }
    setLoginLoading(true); setLoginErr("");
    try {
      const d = await sbAuth("token?grant_type=password",{email:loginEmail,password:loginPwd});
      setAuthToken(d.access_token);
      const p = await sb(`utilisateurs?auth_id=eq.${d.user.id}`,{token:d.access_token});
      if (p?.length>0) setUser({...p[0],photo:p[0].photo_url,email:loginEmail});
      else setUser({email:loginEmail,id:d.user.id,nom:"",prenom:loginEmail.split("@")[0]});
      setPage("marketplace");
    } catch(e){setLoginErr("Email ou mot de passe incorrect.");}
    finally{setLoginLoading(false);}
  };

  const v1=()=>{const e={};if(!reg.nom.trim())e.nom=true;if(!reg.prenom.trim())e.prenom=true;if(!reg.dateNaissance)e.dateNaissance=true;if(!reg.sexe)e.sexe=true;setRegErr(e);return!Object.keys(e).length;};
  const v2=()=>{const e={};if(!reg.filiere.trim())e.filiere=true;if(!reg.annee.trim())e.annee=true;if(!reg.telephone.trim())e.telephone=true;setRegErr(e);return!Object.keys(e).length;};
  const v3=()=>{const e={};if(!reg.email.includes("@"))e.email=true;if(reg.password.length<6)e.password=true;if(reg.password!==reg.confirmPassword)e.confirmPassword=true;setRegErr(e);return!Object.keys(e).length;};

  const handleRegister = async () => {
    if(!v3())return;
    setRegLoading(true);setRegError("");
    try {
      const ad = await sbAuth("signup",{email:reg.email,password:reg.password});
      const tk = ad.access_token||SUPABASE_KEY;
      let photoUrl=null;
      if(reg.photo&&reg.photoFile){try{photoUrl=await uploadPhoto(reg.photo,`profils/${Date.now()}.jpg`,tk);}catch(e){}}
      const [nu] = await sb("utilisateurs",{method:"POST",token:tk,body:JSON.stringify({auth_id:ad.user?.id,nom:reg.nom,prenom:reg.prenom,date_naissance:reg.dateNaissance,sexe:reg.sexe,filiere:reg.filiere,annee:reg.annee,telephone:reg.telephone,photo_url:photoUrl})});
      setAuthToken(tk);setUser({...nu,photo:photoUrl||reg.photo,email:reg.email});setPage("marketplace");
    } catch(e){setRegError("Erreur : "+e.message);}
    finally{setRegLoading(false);}
  };

  const handleForgot = async () => {
    if(!forgotEmail.includes("@")){setForgotErr("Email invalide.");return;}
    setForgotLoading(true);setForgotErr("");
    try{await fetch(`${SUPABASE_URL}/auth/v1/recover`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:forgotEmail})});setForgotOk(true);}
    catch(e){setForgotErr("Erreur. Réessayez.");}
    finally{setForgotLoading(false);}
  };

  const handleReset = async () => {
    if(newPwd.length<6){setResetErr("Minimum 6 caractères.");return;}
    if(newPwd!==confPwd){setResetErr("Les mots de passe ne correspondent pas.");return;}
    setResetLoading(true);setResetErr("");
    try{
      const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:"PUT",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json"},body:JSON.stringify({password:newPwd})});
      if(!r.ok)throw new Error();
      setResetOk(true);setTimeout(()=>{window.location.hash="";setPage("login");},2500);
    }catch(e){setResetErr("Erreur. Réessayez.");}
    finally{setResetLoading(false);}
  };

  const handleLogout = async () => {
    try{await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${authToken}`}});}catch(e){}
    setAuthToken(null);setUser(null);setCart([]);setLoginEmail("");setLoginPwd("");setPage("guest");
  };

  const needAuth = (fn) => { if(!user){setPage("login");return;} fn(); };

  const submitListing = async () => {
    const e={};if(!form.title.trim())e.title=true;if(!form.price||Number(form.price)<=0)e.price=true;if(!form.description.trim())e.description=true;
    setFormErr(e);if(Object.keys(e).length)return;
    setFormLoading(true);setFormError("");
    try{
      const [a]=await sb("annonces",{method:"POST",token:authToken,body:JSON.stringify({utilisateur_id:user.id,type:form.type,titre:form.title,description:form.description,prix:Number(form.price),categorie:form.tag,condition:form.condition||"Non précisé",ville:form.ville||"",quartier:form.quartier||""})});
      const urls=[];
      for(let i=0;i<form.photos.length;i++){try{const u=await uploadPhoto(form.photos[i].base64,`annonces/${a.id}/${i}.jpg`,authToken);urls.push(u);await sb("photos_annonces",{method:"POST",token:authToken,prefer:"return=minimal",body:JSON.stringify({annonce_id:a.id,url:u,ordre:i})});}catch(e){}}
      setListings(p=>[{id:a.id,type:form.type,title:form.title,price:Number(form.price),tag:form.tag,condition:form.condition||"Non précisé",description:form.description,ville:form.ville||"",quartier:form.quartier||"",photos:urls,seller:{...user}},...p]);
      setForm(emptyForm);setFormErr({});setShowForm(false);
    }catch(e){setFormError("Erreur : "+e.message);}
    finally{setFormLoading(false);}
  };

  const delListing = async (id) => {
    setDelLoading(true);
    try{
      await sb(`photos_annonces?annonce_id=eq.${id}`,{method:"DELETE",token:authToken,prefer:"return=minimal"});
      await sb(`annonces?id=eq.${id}`,{method:"DELETE",token:authToken,prefer:"return=minimal"});
      setListings(p=>p.filter(l=>l.id!==id));setDelConfirm(null);setModal(null);
    }catch(e){alert("Erreur : "+e.message);}
    finally{setDelLoading(false);}
  };

  const openEdit = (item) => {setEditForm({id:item.id,type:item.type,title:item.title,price:String(item.price),tag:item.tag,condition:item.condition,description:item.description,ville:item.ville||"",quartier:item.quartier||""});setEditErr("");};
  const saveEdit = async () => {
    if(!editForm.title.trim()||Number(editForm.price)<=0||!editForm.description.trim()){setEditErr("Remplissez tous les champs.");return;}
    setEditLoading(true);setEditErr("");
    try{
      await sb(`annonces?id=eq.${editForm.id}`,{method:"PATCH",token:authToken,prefer:"return=minimal",body:JSON.stringify({type:editForm.type,titre:editForm.title,description:editForm.description,prix:Number(editForm.price),categorie:editForm.tag,condition:editForm.condition||"Non précisé",ville:editForm.ville||"",quartier:editForm.quartier||""})});
      setListings(p=>p.map(l=>l.id===editForm.id?{...l,...editForm,price:Number(editForm.price)}:l));setEditForm(null);
    }catch(e){setEditErr("Erreur : "+e.message);}
    finally{setEditLoading(false);}
  };

  const openProfil = () => {setProfilForm({nom:user.nom||"",prenom:user.prenom||"",filiere:user.filiere||"",annee:user.annee||"",telephone:user.telephone||"",photo:user.photo||null,photoFile:null});setProfilOk(false);setProfilErr("");setShowProfil(true);setShowDD(false);};
  const saveProfil = async () => {
    if(!profilForm.nom.trim()||!profilForm.prenom.trim()||!profilForm.filiere.trim()||!profilForm.telephone.trim()){setProfilErr("Champs obligatoires manquants.");return;}
    setProfilLoading(true);setProfilErr("");setProfilOk(false);
    try{
      let photoUrl=user.photo;
      if(profilForm.photoFile){try{photoUrl=await uploadPhoto(profilForm.photo,`profils/${Date.now()}.jpg`,authToken);}catch(e){}}
      await sb(`utilisateurs?id=eq.${user.id}`,{method:"PATCH",token:authToken,prefer:"return=minimal",body:JSON.stringify({nom:profilForm.nom,prenom:profilForm.prenom,filiere:profilForm.filiere,annee:profilForm.annee,telephone:profilForm.telephone,photo_url:photoUrl})});
      setUser(u=>({...u,nom:profilForm.nom,prenom:profilForm.prenom,filiere:profilForm.filiere,annee:profilForm.annee,telephone:profilForm.telephone,photo:photoUrl}));setProfilOk(true);
    }catch(e){setProfilErr("Erreur : "+e.message);}
    finally{setProfilLoading(false);}
  };

  const fetchConvs = async () => {
    if(!user)return;
    try{
      const msgs=await sb(`messages?or=(expediteur_id.eq.${user.id},destinataire_id.eq.${user.id})&select=*,expediteur:utilisateurs!expediteur_id(*),destinataire:utilisateurs!destinataire_id(*),annonce:annonces(titre)&order=created_at.desc`,{token:authToken});
      const map={};
      msgs.forEach(m=>{
        const other=m.expediteur_id===user.id?m.destinataire:m.expediteur;
        const oid=m.expediteur_id===user.id?m.destinataire_id:m.expediteur_id;
        if(!map[oid])map[oid]={userId:oid,user:other,lastMsg:m,unread:0,annonce:m.annonce};
        if(!m.lu&&m.destinataire_id===user.id)map[oid].unread++;
      });
      const list=Object.values(map);
      setConvs(list);setUnread(list.reduce((s,c)=>s+c.unread,0));
    }catch(e){console.error(e);}
  };

  const openConv = async (conv) => {
    setActiveConv(conv);setMsgLoading(true);
    try{
      const msgs=await sb(`messages?or=(and(expediteur_id.eq.${user.id},destinataire_id.eq.${conv.userId}),and(expediteur_id.eq.${conv.userId},destinataire_id.eq.${user.id}))&select=*,expediteur:utilisateurs!expediteur_id(*)&order=created_at.asc`,{token:authToken});
      setConvMsgs(msgs);
      await sb(`messages?destinataire_id=eq.${user.id}&expediteur_id=eq.${conv.userId}&lu=eq.false`,{method:"PATCH",token:authToken,prefer:"return=minimal",body:JSON.stringify({lu:true})});
      fetchConvs();
    }catch(e){console.error(e);}
    finally{setMsgLoading(false);}
  };

  const sendMsg = async (destId,annonceId=null,texte=null) => {
    const c=texte||newMsg.trim();if(!c)return;
    try{
      const [s]=await sb("messages",{method:"POST",token:authToken,body:JSON.stringify({expediteur_id:user.id,destinataire_id:destId,annonce_id:annonceId,contenu:c})});
      setConvMsgs(p=>[...p,{...s,expediteur:user}]);setNewMsg("");fetchConvs();
    }catch(e){console.error(e);}
  };

  const myAds = listings.filter(l=>l.seller?.id===user?.id);
  const filtered = listings.filter(l=>(tab==="all"||l.type===tab)&&(tag==="Tout"||l.tag===tag)&&(l.title.toLowerCase().includes(search.toLowerCase())||(l.seller?.nom||"").toLowerCase().includes(search.toLowerCase())));
  const addCart = i=>setCart(p=>p.find(c=>c.id===i.id)?p:[...p,i]);
  const rmCart = id=>setCart(p=>p.filter(c=>c.id!==id));
  const total = cart.reduce((s,i)=>s+i.price,0);
  const onProfilePhoto = e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setReg(x=>({...x,photo:ev.target.result,photoFile:f}));r.readAsDataURL(f);};
  const onArticlePhotos = e=>{Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setForm(x=>({...x,photos:x.photos.length<5?[...x.photos,{base64:ev.target.result,file:f}]:x.photos}));r.readAsDataURL(f);});};
  const onProfilPhoto = e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setProfilForm(x=>({...x,photo:ev.target.result,photoFile:f}));r.readAsDataURL(f);};

  /* ─── AUTH WRAPPER ─── */
  const A = (title,sub,body) => (
    <div className="auth-page">
      <style>{CSS}</style>
      <div className="auth-card">
        <LeftPanel/>
        <div className="auth-body">
          <div style={{fontSize:"clamp(20px,5vw,24px)",fontWeight:700,color:"#111",marginBottom:4}}>{title}</div>
          <div style={{fontSize:14,color:"#888",marginBottom:24}}>{sub}</div>
          {body}
        </div>
      </div>
    </div>
  );

  /* ─── LOGIN ─── */
  if(page==="login") return A("Connexion","Connectez-vous à votre compte",
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><label className="lbl">Email</label><input className="inp" type="email" placeholder="exemple@email.com" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
      <div><label className="lbl">Mot de passe</label><input className="inp" type="password" placeholder="••••••••" value={loginPwd} onChange={e=>setLoginPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
      <div style={{textAlign:"right"}}><button className="a-link" onClick={()=>{setPage("forgot");setForgotErr("");setForgotOk(false);}}>Mot de passe oublié ?</button></div>
      {loginErr&&<div className="err-box">{loginErr}</div>}
      <button className="btn btn-red btn-block" onClick={handleLogin} disabled={loginLoading}>{loginLoading?<><span className="spinner"/>Connexion...</>:"Se connecter"}</button>
      <div style={{textAlign:"center",fontSize:14,color:"#666"}}>Pas encore de compte ?{" "}<button className="a-link" onClick={()=>{setPage("register");setRegStep(1);setRegErr({});setRegError("");}}>Créer un compte</button></div>
      <div style={{textAlign:"center"}}><button className="a-link" style={{fontSize:13,color:"#999"}} onClick={()=>setPage("guest")}>Continuer sans compte</button></div>
    </div>
  );

  /* ─── FORGOT ─── */
  if(page==="forgot") return A("Mot de passe oublié","Un lien sera envoyé à votre email",
    !forgotOk?(
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div><label className="lbl">Email</label><input className="inp" type="email" placeholder="exemple@email.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/></div>
        {forgotErr&&<div className="err-box">{forgotErr}</div>}
        <button className="btn btn-red btn-block" onClick={handleForgot} disabled={forgotLoading}>{forgotLoading?<><span className="spinner"/>Envoi...</>:"Envoyer le lien"}</button>
        <div style={{textAlign:"center"}}><button className="a-link" onClick={()=>setPage("login")}>Retour à la connexion</button></div>
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div className="ok-box">Lien envoyé à <strong>{forgotEmail}</strong>. Vérifiez votre boîte mail.</div>
        <button className="btn btn-red btn-block" onClick={()=>setPage("login")}>Retour à la connexion</button>
      </div>
    )
  );

  /* ─── RESET ─── */
  if(page==="reset") return A("Nouveau mot de passe","Choisissez un nouveau mot de passe",
    !resetOk?(
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div><label className="lbl">Nouveau mot de passe</label><input className="inp" type="password" placeholder="Minimum 6 caractères" value={newPwd} onChange={e=>setNewPwd(e.target.value)}/></div>
        <div><label className="lbl">Confirmer</label><input className="inp" type="password" placeholder="Répétez" value={confPwd} onChange={e=>setConfPwd(e.target.value)}/></div>
        {resetErr&&<div className="err-box">{resetErr}</div>}
        <button className="btn btn-red btn-block" onClick={handleReset} disabled={resetLoading}>{resetLoading?<><span className="spinner"/>Mise à jour...</>:"Mettre à jour"}</button>
      </div>
    ):<div className="ok-box">Mot de passe mis à jour ! Redirection...</div>
  );

  /* ─── REGISTER ─── */
  if(page==="register") return A(
    regStep===1?"Informations personnelles":regStep===2?"Informations académiques":"Identifiants de connexion",
    `Étape ${regStep} sur 3`,
    <>
      <div style={{display:"flex",alignItems:"center",marginBottom:22}}>
        {[1,2,3].map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:regStep>=s?"#C8102E":"#e8e8e8",color:regStep>=s?"white":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{s}</div>
              <span style={{fontSize:12,color:regStep===s?"#111":"#aaa",fontWeight:regStep===s?600:400}}>{s===1?"Identité":s===2?"Académique":"Compte"}</span>
            </div>
            {i<2&&<div style={{flex:1,height:1,background:regStep>s?"#C8102E":"#e0e0e0",margin:"0 8px"}}/>}
          </div>
        ))}
      </div>

      {regStep===1&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label className="lbl lbl-opt">Photo de profil</label>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:60,height:60,borderRadius:"50%",background:"#f3f3f3",border:"1px solid #ddd",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {reg.photo?<img src={reg.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<Ic n="user" s={22} c="#bbb"/>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button className="btn btn-white" style={{padding:"7px 14px",fontSize:13}} onClick={()=>profileRef.current.click()}>{reg.photo?"Changer":"Choisir"}</button>
                {reg.photo&&<button onClick={()=>setReg(r=>({...r,photo:null,photoFile:null}))} style={{background:"none",border:"none",fontSize:13,color:"#C8102E",cursor:"pointer"}}>Supprimer</button>}
              </div>
              <input ref={profileRef} type="file" accept="image/*" style={{display:"none"}} onChange={onProfilePhoto}/>
            </div>
          </div>
          <div className="form-2col">
            <div><label className="lbl">Nom *</label><input className={`inp ${regErr.nom?"err":""}`} placeholder="Koné" value={reg.nom} onChange={e=>setReg(r=>({...r,nom:e.target.value}))}/></div>
            <div><label className="lbl">Prénom *</label><input className={`inp ${regErr.prenom?"err":""}`} placeholder="Aminata" value={reg.prenom} onChange={e=>setReg(r=>({...r,prenom:e.target.value}))}/></div>
          </div>
          <div><label className="lbl">Date de naissance *</label><input type="date" className={`inp ${regErr.dateNaissance?"err":""}`} value={reg.dateNaissance} onChange={e=>setReg(r=>({...r,dateNaissance:e.target.value}))}/></div>
          <div>
            <label className="lbl">Sexe *</label>
            <div style={{display:"flex",gap:10}}>{["Homme","Femme"].map(s=><button key={s} className={`sexe-btn ${reg.sexe===s?"on":""}`} onClick={()=>setReg(r=>({...r,sexe:s}))}>{s}</button>)}</div>
            {regErr.sexe&&<div style={{fontSize:12,color:"#C8102E",marginTop:5}}>Sélectionnez votre sexe</div>}
          </div>
          {Object.keys(regErr).length>0&&<div className="err-box">Veuillez remplir tous les champs obligatoires.</div>}
          <button className="btn btn-red btn-block" onClick={()=>{if(v1())setRegStep(2);}}>Continuer</button>
          <div style={{textAlign:"center",fontSize:14,color:"#666"}}>Déjà un compte ?{" "}<button className="a-link" onClick={()=>setPage("login")}>Se connecter</button></div>
        </div>
      )}

      {regStep===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label className="lbl">Filière *</label><input className={`inp ${regErr.filiere?"err":""}`} placeholder="ex: Informatique, Droit..." value={reg.filiere} onChange={e=>setReg(r=>({...r,filiere:e.target.value}))}/></div>
          <div><label className="lbl">Année d'études *</label><input className={`inp ${regErr.annee?"err":""}`} placeholder="ex: Licence 2, Master 1..." value={reg.annee} onChange={e=>setReg(r=>({...r,annee:e.target.value}))}/></div>
          <div><label className="lbl">Téléphone *</label><input className={`inp ${regErr.telephone?"err":""}`} placeholder="+226 70 00 00 00" value={reg.telephone} onChange={e=>setReg(r=>({...r,telephone:e.target.value}))}/></div>
          {Object.keys(regErr).length>0&&<div className="err-box">Veuillez remplir tous les champs obligatoires.</div>}
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-white" style={{flex:1}} onClick={()=>{setRegStep(1);setRegErr({});}}>Retour</button>
            <button className="btn btn-red" style={{flex:2}} onClick={()=>{if(v2())setRegStep(3);}}>Continuer</button>
          </div>
        </div>
      )}

      {regStep===3&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label className="lbl">Email *</label><input className={`inp ${regErr.email?"err":""}`} type="email" placeholder="exemple@email.com" value={reg.email} onChange={e=>setReg(r=>({...r,email:e.target.value}))}/></div>
          <div><label className="lbl">Mot de passe * <span style={{fontWeight:400,color:"#aaa",fontSize:12,textTransform:"none"}}>(min. 6 caractères)</span></label>
            <input className={`inp ${regErr.password?"err":""}`} type="password" placeholder="••••••••" value={reg.password} onChange={e=>setReg(r=>({...r,password:e.target.value}))}/>
          </div>
          <div><label className="lbl">Confirmer *</label>
            <input className={`inp ${regErr.confirmPassword?"err":""}`} type="password" placeholder="••••••••" value={reg.confirmPassword} onChange={e=>setReg(r=>({...r,confirmPassword:e.target.value}))}/>
            {regErr.confirmPassword&&<div style={{fontSize:12,color:"#C8102E",marginTop:5}}>Les mots de passe ne correspondent pas</div>}
          </div>
          {regError&&<div className="err-box">{regError}</div>}
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-white" style={{flex:1}} onClick={()=>{setRegStep(2);setRegErr({});setRegError("");}}>Retour</button>
            <button className="btn btn-red" style={{flex:2}} onClick={handleRegister} disabled={regLoading}>{regLoading?<><span className="spinner"/>Inscription...</>:"S'inscrire"}</button>
          </div>
        </div>
      )}
    </>
  );

  /* ═══════════ MARKETPLACE (guest + connecté) ═══════════ */
  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:"white",minHeight:"100vh",width:"100%",maxWidth:"100%"}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{background:"#1B0007",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",gap:8,height:54,padding:"0 12px",overflow:"hidden"}}>
          {/* Logo */}
          <div style={{flexShrink:0,cursor:"pointer"}} onClick={()=>setPage("guest")}>
            <div style={{color:"white",fontWeight:700,fontSize:14}}>Faso_Karanbissi</div>
            <div className="hdr-search" style={{color:"#ff9999",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontWeight:600,display:"none"}}>Plateforme universitaire</div>
          </div>

          {/* Search — desktop only */}
          <div className="hdr-search" style={{display:"none",flex:1,maxWidth:560,height:36}}>
            <select style={{padding:"0 8px",background:"#e3e3e3",border:"none",borderRadius:"4px 0 0 4px",fontSize:12,color:"#333",cursor:"pointer",outline:"none",height:"100%"}} value={tag} onChange={e=>setTag(e.target.value)}>
              {tags.map(t=><option key={t}>{t}</option>)}
            </select>
            <input style={{flex:1,padding:"0 12px",border:"none",fontSize:13,outline:"none",color:"#111",height:"100%"}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <button style={{background:"#C8102E",border:"none",padding:"0 14px",borderRadius:"0 4px 4px 0",cursor:"pointer",color:"white",height:"100%",display:"flex",alignItems:"center"}}><Ic n="srch" s={16} c="white"/></button>
          </div>

          <div style={{flex:1}}/>

          {/* Panier */}
          <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,padding:"6px 10px",flexShrink:0}} onClick={()=>setShowCart(true)}>
            <Ic n="cart" s={18} c="white"/>
            <span style={{fontSize:12,fontWeight:600,color:"white",display:"none"}} className="hdr-search">Panier</span>
            {cart.length>0&&<Badge n={cart.length} style={{border:"1.5px solid white"}}/>}
          </div>

          {/* Visiteur */}
          {!user?(
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>setPage("login")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:4,padding:"7px 9px",color:"white",fontSize:11,cursor:"pointer",fontWeight:500,whiteSpace:"nowrap"}}>Connexion</button>
              <button onClick={()=>{setPage("register");setRegStep(1);}} style={{background:"white",border:"none",borderRadius:4,padding:"7px 9px",color:"#C8102E",fontSize:11,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>S'inscrire</button>
            </div>
          ):(
            /* Menu déroulant */
            <div className="dropdown" ref={ddRef} style={{flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,padding:"5px 10px"}} onClick={()=>setShowDD(v=>!v)}>
                <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid rgba(255,255,255,0.5)"}}>
                  {user.photo?<img src={user.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#C8102E",color:"white",fontSize:11,fontWeight:700}}>{user.prenom?.[0]}{user.nom?.[0]}</div>}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:"white",maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.prenom}</span>
                <Ic n="chev" s={12} c="rgba(255,255,255,0.7)"/>
                {unread>0&&<Badge n={unread} style={{border:"1px solid white",fontSize:10}}/>}
              </div>
              {showDD&&(
                <div className="dd-menu">
                  <button className="dd-item" onClick={openProfil}><Ic n="user" s={15} c="#555"/>Mon profil</button>
                  <button className="dd-item" onClick={()=>{setShowMyAds(true);setShowDD(false);}}>
                    <Ic n="list" s={15} c="#555"/>Mes annonces
                    {myAds.length>0&&<Badge n={myAds.length} style={{marginLeft:"auto"}}/>}
                  </button>
                  <button className="dd-item" onClick={()=>{setShowMsgs(true);fetchConvs();setShowDD(false);}}>
                    <Ic n="msg" s={15} c="#555"/>Messages
                    {unread>0&&<Badge n={unread} style={{marginLeft:"auto"}}/>}
                  </button>
                  <div className="dd-sep"/>
                  <button className="dd-item red" onClick={handleLogout}><Ic n="out" s={15} c="#C8102E"/>Déconnexion</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search mobile */}
      <div className="mob-search" style={{background:"#111",padding:"8px 12px",display:"flex",gap:8}}>
        <input style={{flex:1,padding:"9px 12px",border:"none",borderRadius:4,fontSize:14,outline:"none",color:"#111"}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{padding:"0 8px",background:"#e3e3e3",border:"none",borderRadius:4,fontSize:12,color:"#333",outline:"none"}} value={tag} onChange={e=>setTag(e.target.value)}>
          {tags.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* ── NAV ── */}
      <div style={{background:"#C8102E",overflowX:"auto",WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none"}}>
        <div style={{display:"flex",alignItems:"center",height:44,padding:"0 10px",minWidth:"max-content",gap:2}}>
          {[["all","Tout"],["product","Produits"],["service","Services"]].map(([v,l])=>(
            <button key={v} className={`nav-btn ${tab===v?"on":""}`} onClick={()=>setTab(v)}>{l}</button>
          ))}
          <div style={{width:1,height:18,background:"rgba(255,255,255,0.3)",margin:"0 6px"}}/>
          {tags.slice(1).map(t=><button key={t} className={`nav-btn ${tag===t?"on":""}`} onClick={()=>setTag(tag===t?"Tout":t)}>{t}</button>)}
          <div style={{flex:1}}/>
          <button onClick={()=>needAuth(()=>setShowForm(true))} style={{background:"white",color:"#C8102E",border:"none",padding:"6px 12px",borderRadius:3,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>+ Publier</button>
        </div>
      </div>

      {/* ── BANNIÈRE BIENVENUE ── */}
      <div style={{background:"linear-gradient(135deg,#1B0007 0%,#C8102E 100%)",overflow:"hidden"}}>
        {/* Texte défilant */}
        <div style={{background:"rgba(0,0,0,0.2)",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.1)",overflow:"hidden"}}>
          <div className="marquee" style={{color:"rgba(255,255,255,0.9)",fontSize:13}}>
            {["Bienvenue sur Faso_Karanbissi","·","Achetez et vendez entre étudiants","·","Proposez vos services sur le campus","·","Connectez-vous avec vos camarades","·","Livres, électronique, vêtements et plus","·","Bienvenue sur Faso_Karanbissi","·","Achetez et vendez entre étudiants","·","Proposez vos services sur le campus","·","Connectez-vous avec vos camarades","·"].map((t,i)=>(
              <span key={i} style={{padding:"0 28px",opacity:t==="·"?0.4:1}}>{t}</span>
            ))}
          </div>
        </div>
        {/* Hero */}
        <div className="hero-inner" style={{maxWidth:1280,margin:"0 auto",padding:"20px 14px 28px",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div className="hero-text" style={{color:"white",minWidth:0}}>
            <div style={{fontSize:"clamp(20px,5vw,26px)",fontWeight:700,lineHeight:1.3,marginBottom:8}}>La plateforme des étudiants entrepreneurs</div>
            <div style={{fontSize:13,opacity:0.85,lineHeight:1.6,marginBottom:14,maxWidth:480}}>Vendez vos articles, proposez vos services et connectez-vous avec les étudiants de votre campus.</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Livres & Cours","Electronique","Services","Vetements"].map(label=>(
                <button key={label} onClick={()=>setTag(label)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:20,padding:"6px 14px",color:"white",fontSize:12,cursor:"pointer",fontWeight:500}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-features" style={{flexDirection:"column",gap:8,minWidth:200,flexShrink:0}}>
            {[["Annonces publiées","Voir les offres de vos camarades"],["Services disponibles","Cours, design, traduction et plus"],["Messagerie intégrée","Échangez avec les vendeurs"]].map(([t,d])=>(
              <div key={t} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:6,padding:"9px 12px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"white",flexShrink:0}}/>
                <div><div style={{color:"white",fontSize:13,fontWeight:600}}>{t}</div><div style={{color:"rgba(255,255,255,0.65)",fontSize:11,marginTop:2}}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ANNONCES ── */}
      <div style={{maxWidth:1280,margin:"0 auto",padding:"16px 16px 40px",background:"white"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,color:"#555"}}>{filtered.length} résultat{filtered.length>1?"s":""}{tag!=="Tout"&&` dans "${tag}"`}</div>
          <button onClick={fetchListings} style={{background:"none",border:"1px solid #ddd",borderRadius:3,padding:"5px 12px",fontSize:12,cursor:"pointer",color:"#555"}}>Actualiser</button>
        </div>

        {loadingL?(
          <div style={{textAlign:"center",padding:"48px 0",color:"#aaa"}}>
            <div style={{width:28,height:28,border:"3px solid #eee",borderTopColor:"#C8102E",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 12px"}}/>
            <div>Chargement...</div>
          </div>
        ):listings.length===0?(
          <div style={{background:"white",border:"1px solid #ddd",borderRadius:6,padding:"48px 20px",textAlign:"center"}}>
            <Ic n="img" s={40} c="#ccc"/>
            <div style={{fontSize:16,fontWeight:600,marginTop:14,marginBottom:8}}>Aucune annonce disponible</div>
            <div style={{fontSize:13,color:"#888",marginBottom:18}}>Soyez le premier à publier.</div>
            <button className="btn btn-red" style={{padding:"10px 22px"}} onClick={()=>needAuth(()=>setShowForm(true))}>Publier la première annonce</button>
          </div>
        ):filtered.length===0?(
          <div style={{background:"white",border:"1px solid #ddd",borderRadius:6,padding:"36px",textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Aucun résultat</div>
            <div style={{fontSize:13,color:"#888"}}>Essayez un autre filtre.</div>
          </div>
        ):(
          <div className="cards-grid">
            {filtered.map(item=>(
              <div key={item.id} className="card" onClick={()=>{setModal(item);setMTab("article");setMPhotoIdx(0);}}>
                <div style={{background:"#f3f3f3",height:"clamp(130px,30vw,170px)",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:"1px solid #eee",overflow:"hidden",position:"relative"}}>
                  {item.photos?.length>0?<img src={item.photos[0]} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Ic n="img" s={36} c="#ccc"/>}
                  {item.photos?.length>1&&<div style={{position:"absolute",bottom:5,right:5,background:"rgba(0,0,0,0.55)",color:"white",fontSize:10,padding:"2px 6px",borderRadius:2,fontWeight:600}}>+{item.photos.length-1}</div>}
                  <div style={{position:"absolute",top:6,left:6}}><span style={{fontSize:9,background:item.type==="service"?"#0066cc":"#2d8a2d",color:"white",padding:"2px 7px",borderRadius:2,fontWeight:700,textTransform:"uppercase"}}>{item.type==="service"?"Service":"Produit"}</span></div>
                </div>
                <div style={{padding:"10px 11px"}}>
                  <div style={{fontSize:10,color:"#C8102E",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{item.tag}</div>
                  <div style={{fontSize:"clamp(12px,3.5vw,14px)",fontWeight:500,color:"#111",marginBottom:4,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.title}</div>
                  <div style={{fontSize:11,color:"#888",marginBottom:3}}>{item.seller?.prenom} {item.seller?.nom}</div>
                  {(item.ville||item.quartier)&&<div style={{fontSize:10,color:"#aaa",marginBottom:5,display:"flex",alignItems:"center",gap:3}}><Ic n="pin" s={10} c="#aaa"/>{[item.quartier,item.ville].filter(Boolean).join(", ")}</div>}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                    <div><span style={{fontSize:"clamp(14px,4vw,17px)",fontWeight:700}}>{item.price.toLocaleString()}</span><span style={{fontSize:10,color:"#888",marginLeft:2}}>FCFA</span></div>
                    <button className="btn btn-red" style={{fontSize:11,padding:"5px 10px"}} onClick={e=>{e.stopPropagation();user?addCart(item):setPage("login");}}>
                      {item.type==="service"?"Réserver":"Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ANNONCE ── */}
      {modal&&(
        <div className="overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{display:"flex",borderBottom:"1px solid #eee",flexShrink:0,background:"#fafafa"}}>
              <button className={`tab-btn ${mTab==="article"?"on":""}`} onClick={()=>setMTab("article")}>Détail</button>
              <button className={`tab-btn ${mTab==="vendeur"?"on":""}`} onClick={()=>setMTab("vendeur")}>Vendeur</button>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {mTab==="article"?(
                <div style={{padding:"14px 16px"}}>
                  {modal.photos?.length>0?(
                    <div style={{marginBottom:14}}>
                      <div style={{width:"100%",height:"clamp(180px,50vw,240px)",background:"#f3f3f3",borderRadius:6,overflow:"hidden",marginBottom:8,border:"1px solid #eee"}}><img src={modal.photos[mPhotoIdx]} style={{width:"100%",height:"100%",objectFit:"contain"}}/></div>
                      {modal.photos.length>1&&<div style={{display:"flex",gap:6,overflowX:"auto"}}>{modal.photos.map((p,i)=><div key={i} onClick={()=>setMPhotoIdx(i)} style={{width:50,height:50,borderRadius:4,overflow:"hidden",border:`2px solid ${mPhotoIdx===i?"#C8102E":"#ddd"}`,cursor:"pointer",flexShrink:0}}><img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>}
                    </div>
                  ):(
                    <div style={{width:"100%",height:130,background:"#f3f3f3",borderRadius:6,border:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><Ic n="img" s={36} c="#ccc"/></div>
                  )}
                  <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,background:modal.type==="service"?"#e8f4fd":"#f0faf0",color:modal.type==="service"?"#0066cc":"#2d8a2d",padding:"3px 10px",borderRadius:2,fontWeight:700,textTransform:"uppercase"}}>{modal.type==="service"?"Service":"Produit"}</span>
                    <span style={{fontSize:10,background:"#f3f3f3",color:"#555",padding:"3px 10px",borderRadius:2,fontWeight:600}}>{modal.tag}</span>
                    <span style={{fontSize:10,background:"#f3f3f3",color:"#555",padding:"3px 10px",borderRadius:2,fontWeight:600}}>{modal.condition}</span>
                  </div>
                  <div style={{fontSize:"clamp(15px,4vw,18px)",fontWeight:700,marginBottom:6}}>{modal.title}</div>
                  <div style={{fontSize:"clamp(18px,5vw,24px)",fontWeight:700,marginBottom:10}}>{modal.price.toLocaleString()} <span style={{fontSize:13,fontWeight:400,color:"#555"}}>FCFA</span></div>
                  {(modal.ville||modal.quartier)&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,fontSize:13,color:"#666"}}><Ic n="pin" s={14} c="#C8102E"/>{[modal.quartier,modal.ville].filter(Boolean).join(", ")}</div>}
                  <div style={{fontSize:13,color:"#333",lineHeight:1.8,marginBottom:14,background:"#fafafa",borderRadius:4,padding:"12px",border:"1px solid #eee"}}>{modal.description}</div>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#f3f3f3",borderRadius:6,marginBottom:12,cursor:"pointer",border:"1px solid #ddd"}} onClick={()=>setMTab("vendeur")}>
                    <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {modal.seller?.photo?<img src={modal.seller.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{color:"white",fontSize:12,fontWeight:700}}>{modal.seller?.prenom?.[0]}{modal.seller?.nom?.[0]}</span>}
                    </div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{modal.seller?.prenom} {modal.seller?.nom}</div><div style={{fontSize:11,color:"#888"}}>{modal.seller?.filiere}</div></div>
                    <div style={{fontSize:12,color:"#C8102E",fontWeight:600}}>Voir</div>
                  </div>
                  {user&&modal.seller?.id===user.id&&(
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      <button onClick={()=>{openEdit(modal);setModal(null);}} style={{flex:1,background:"#f3f3f3",border:"1px solid #ddd",borderRadius:4,padding:"9px",fontSize:13,cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Ic n="edit" s={14} c="#555"/>Modifier</button>
                      <button onClick={()=>{setDelConfirm(modal.id);setModal(null);}} style={{flex:1,background:"#fff3f3",border:"1px solid #fcc",borderRadius:4,padding:"9px",fontSize:13,cursor:"pointer",color:"#C8102E",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Ic n="del" s={14} c="#C8102E"/>Supprimer</button>
                    </div>
                  )}
                  {user&&modal.seller?.id!==user.id&&(
                    <button onClick={()=>{setContactModal({seller:modal.seller,annonce:modal});setModal(null);setNewMsg("");}} style={{width:"100%",background:"#f3f3f3",border:"1px solid #ddd",borderRadius:4,padding:"10px",fontSize:13,cursor:"pointer",fontWeight:500,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Ic n="msg" s={15} c="#555"/>Envoyer un message au vendeur</button>
                  )}
                  {!user&&<div style={{marginBottom:10,background:"#fff8e6",border:"1px solid #f5d78e",borderRadius:4,padding:"10px 14px",fontSize:13,color:"#7a5c00",textAlign:"center"}}><button className="a-link" style={{fontSize:13}} onClick={()=>setPage("login")}>Connectez-vous</button> pour contacter le vendeur.</div>}
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn btn-white" style={{flex:1}} onClick={()=>setModal(null)}>Fermer</button>
                    <button className="btn btn-red" style={{flex:1}} onClick={()=>{if(user){addCart(modal);setModal(null);}else setPage("login");}}>{modal.type==="service"?"Réserver":"Ajouter au panier"}</button>
                  </div>
                </div>
              ):(
                <div style={{padding:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,paddingBottom:14,borderBottom:"1px solid #eee"}}>
                    <div style={{width:52,height:52,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {modal.seller?.photo?<img src={modal.seller.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{color:"white",fontSize:16,fontWeight:700}}>{modal.seller?.prenom?.[0]}{modal.seller?.nom?.[0]}</span>}
                    </div>
                    <div><div style={{fontSize:17,fontWeight:700}}>{modal.seller?.prenom} {modal.seller?.nom}</div><div style={{fontSize:13,color:"#888",marginTop:2}}>{modal.seller?.filiere} · {modal.seller?.annee}</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    {[["Filière",modal.seller?.filiere],["Niveau",modal.seller?.annee],["Sexe",modal.seller?.sexe],["Téléphone",modal.seller?.telephone]].map(([l,v])=>(
                      <div key={l} style={{background:"#fafafa",borderRadius:4,padding:"10px 12px",border:"1px solid #eee"}}>
                        <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                        <div style={{fontWeight:600,fontSize:13}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {user?(
                    <button className="btn btn-red btn-block" onClick={()=>window.open(`tel:${modal.seller?.telephone}`)}>Contacter — {modal.seller?.telephone}</button>
                  ):(
                    <div style={{background:"#fff8e6",border:"1px solid #f5d78e",borderRadius:4,padding:"12px",fontSize:13,color:"#7a5c00",textAlign:"center"}}><button className="a-link" style={{fontSize:13}} onClick={()=>setPage("login")}>Connectez-vous</button> pour voir les coordonnées.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLIER ANNONCE ── */}
      {showForm&&(
        <div className="overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:700}}>Publier une annonce</div>
              <div style={{fontSize:12,color:"#888"}}>Les champs * sont obligatoires</div>
            </div>
            <div style={{padding:"14px 16px",overflowY:"auto",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Type</label><select className="inp" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="product">Produit à vendre</option><option value="service">Service à offrir</option></select></div>
              <div><label className="lbl">Titre *</label><input className={`inp ${formErr.title?"err":""}`} placeholder="Titre de l'annonce" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label className="lbl">Prix (FCFA) *</label><input className={`inp ${formErr.price?"err":""}`} type="number" placeholder="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
                <div><label className="lbl">Categorie</label><select className="inp" value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}>{tags.slice(1).map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label className="lbl">Ville</label><input className="inp" placeholder="Bobo-Dioulasso" value={form.ville} onChange={e=>setForm(f=>({...f,ville:e.target.value}))}/></div>
                <div><label className="lbl">Quartier</label><input className="inp" placeholder="Secteur 22" value={form.quartier} onChange={e=>setForm(f=>({...f,quartier:e.target.value}))}/></div>
              </div>
              <div><label className="lbl">Etat</label><input className="inp" placeholder="ex: Bon état, Neuf..." value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))}/></div>
              <div><label className="lbl">Description *</label><textarea className={`inp ${formErr.description?"err":""}`} placeholder="Décrivez votre article..." rows={3} style={{resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div>
                <label className="lbl lbl-opt">Photos</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:form.photos.length?8:0}}>
                  {form.photos.map((p,i)=><div key={i} className="photo-thumb"><img src={p.base64||p} alt=""/><button className="photo-del" onClick={()=>setForm(f=>({...f,photos:f.photos.filter((_,j)=>j!==i)}))}>x</button></div>)}
                </div>
                {form.photos.length<5&&(
                  <div className="photo-drop" onClick={()=>articleRef.current.click()}>
                    <Ic n="img" s={28} c="#aaa"/>
                    <div style={{fontSize:13,color:"#666",fontWeight:500,marginTop:8}}>Ajouter des photos</div>
                    <div style={{fontSize:11,color:"#aaa",marginTop:4}}>Max 5 ({form.photos.length}/5)</div>
                  </div>
                )}
                <input ref={articleRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={onArticlePhotos}/>
              </div>
              {Object.keys(formErr).length>0&&<div className="err-box">Veuillez remplir tous les champs obligatoires.</div>}
              {formError&&<div className="err-box">{formError}</div>}
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-white" style={{flex:1}} onClick={()=>{setShowForm(false);setFormErr({});setFormError("");}}>Annuler</button>
                <button className="btn btn-red" style={{flex:2}} onClick={submitListing} disabled={formLoading}>{formLoading?<><span className="spinner"/>Publication...</>:"Publier"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MES ANNONCES ── */}
      {showMyAds&&(
        <div className="overlay" onClick={()=>setShowMyAds(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:15,fontWeight:700}}>Mes annonces</div><div style={{fontSize:12,color:"#888"}}>{myAds.length} publication{myAds.length>1?"s":""}</div></div>
              <button onClick={()=>setShowMyAds(false)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic n="x" s={20} c="#888"/></button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"12px 16px"}}>
              {myAds.length===0?(
                <div style={{textAlign:"center",padding:"36px 0",color:"#aaa"}}>
                  <div style={{fontSize:14,marginBottom:14}}>Vous n'avez pas encore publié d'annonce</div>
                  <button className="btn btn-red" onClick={()=>{setShowMyAds(false);setShowForm(true);}}>Publier une annonce</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {myAds.map(item=>(
                    <div key={item.id} style={{display:"flex",gap:12,background:"white",border:"1px solid #eee",borderRadius:6,padding:"11px",alignItems:"center"}}>
                      <div style={{width:50,height:50,background:"#f3f3f3",borderRadius:4,overflow:"hidden",flexShrink:0,border:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {item.photos?.[0]?<img src={item.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<Ic n="img" s={18} c="#ccc"/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                        <div style={{fontSize:11,color:"#888"}}>{item.tag}</div>
                        <div style={{fontSize:14,fontWeight:700,color:"#C8102E"}}>{item.price.toLocaleString()} FCFA</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>{openEdit(item);setShowMyAds(false);}} style={{background:"#f3f3f3",border:"1px solid #ddd",borderRadius:4,padding:"6px 10px",fontSize:12,cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:4}}><Ic n="edit" s={12} c="#555"/>Modifier</button>
                        <button onClick={()=>{setDelConfirm(item.id);setShowMyAds(false);}} style={{background:"#fff3f3",border:"1px solid #fcc",borderRadius:4,padding:"6px 10px",fontSize:12,cursor:"pointer",color:"#C8102E",fontWeight:500,display:"flex",alignItems:"center",gap:4}}><Ic n="del" s={12} c="#C8102E"/>Suppr.</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODIFIER ANNONCE ── */}
      {editForm&&(
        <div className="overlay" onClick={()=>setEditForm(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}><div style={{fontSize:15,fontWeight:700}}>Modifier l'annonce</div></div>
            <div style={{padding:"14px 16px",overflowY:"auto",display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="lbl">Type</label><select className="inp" value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))}><option value="product">Produit</option><option value="service">Service</option></select></div>
              <div><label className="lbl">Titre *</label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label className="lbl">Prix *</label><input className="inp" type="number" value={editForm.price} onChange={e=>setEditForm(f=>({...f,price:e.target.value}))}/></div>
                <div><label className="lbl">Categorie</label><select className="inp" value={editForm.tag} onChange={e=>setEditForm(f=>({...f,tag:e.target.value}))}>{tags.slice(1).map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label className="lbl">Ville</label><input className="inp" value={editForm.ville} onChange={e=>setEditForm(f=>({...f,ville:e.target.value}))}/></div>
                <div><label className="lbl">Quartier</label><input className="inp" value={editForm.quartier} onChange={e=>setEditForm(f=>({...f,quartier:e.target.value}))}/></div>
              </div>
              <div><label className="lbl">Etat</label><input className="inp" value={editForm.condition} onChange={e=>setEditForm(f=>({...f,condition:e.target.value}))}/></div>
              <div><label className="lbl">Description *</label><textarea className="inp" rows={3} style={{resize:"vertical"}} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
              {editErr&&<div className="err-box">{editErr}</div>}
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-white" style={{flex:1}} onClick={()=>setEditForm(null)}>Annuler</button>
                <button className="btn btn-red" style={{flex:2}} onClick={saveEdit} disabled={editLoading}>{editLoading?<><span className="spinner"/>Sauvegarde...</>:"Sauvegarder"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MON PROFIL ── */}
      {showProfil&&profilForm&&(
        <div className="overlay" onClick={()=>setShowProfil(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}><div style={{fontSize:15,fontWeight:700}}>Mon profil</div></div>
            <div style={{padding:"14px 16px",overflowY:"auto",display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <label className="lbl lbl-opt">Photo de profil</label>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:58,height:58,borderRadius:"50%",background:"#f3f3f3",border:"1px solid #ddd",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {profilForm.photo?<img src={profilForm.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{width:"100%",height:"100%",background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:18,fontWeight:700}}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>}
                  </div>
                  <div>
                    <button className="btn btn-white" style={{fontSize:13,padding:"7px 14px"}} onClick={()=>profilRef.current.click()}>Changer la photo</button>
                    <input ref={profilRef} type="file" accept="image/*" style={{display:"none"}} onChange={onProfilPhoto}/>
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label className="lbl">Nom *</label><input className="inp" value={profilForm.nom} onChange={e=>setProfilForm(f=>({...f,nom:e.target.value}))}/></div>
                <div><label className="lbl">Prenom *</label><input className="inp" value={profilForm.prenom} onChange={e=>setProfilForm(f=>({...f,prenom:e.target.value}))}/></div>
              </div>
              <div><label className="lbl">Filiere *</label><input className="inp" value={profilForm.filiere} onChange={e=>setProfilForm(f=>({...f,filiere:e.target.value}))}/></div>
              <div><label className="lbl">Annee</label><input className="inp" value={profilForm.annee} onChange={e=>setProfilForm(f=>({...f,annee:e.target.value}))}/></div>
              <div><label className="lbl">Telephone *</label><input className="inp" value={profilForm.telephone} onChange={e=>setProfilForm(f=>({...f,telephone:e.target.value}))}/></div>
              {profilErr&&<div className="err-box">{profilErr}</div>}
              {profilOk&&<div className="ok-box">Profil mis à jour !</div>}
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-white" style={{flex:1}} onClick={()=>setShowProfil(false)}>Fermer</button>
                <button className="btn btn-red" style={{flex:2}} onClick={saveProfil} disabled={profilLoading}>{profilLoading?<><span className="spinner"/>Sauvegarde...</>:"Sauvegarder"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGERIE ── */}
      {showMsgs&&(
        <div className="overlay" onClick={()=>{setShowMsgs(false);setActiveConv(null);}}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:700,height:"88vh"}}>
            <div className="modal-handle"/>
            <div style={{padding:"11px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700}}>Messagerie</div>
              <button onClick={()=>{setShowMsgs(false);setActiveConv(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic n="x" s={20} c="#888"/></button>
            </div>
            <div style={{display:"flex",flex:1,overflow:"hidden"}}>
              <div style={{width:210,borderRight:"1px solid #eee",overflowY:"auto",flexShrink:0}}>
                {convs.length===0?(
                  <div style={{textAlign:"center",padding:"28px 12px",color:"#aaa",fontSize:13}}>Aucune conversation</div>
                ):convs.map(c=>(
                  <div key={c.userId} className={`conv-row ${activeConv?.userId===c.userId?"on":""}`} onClick={()=>openConv(c)}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:"#C8102E",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:700,flexShrink:0}}>{c.user?.prenom?.[0]}{c.user?.nom?.[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.user?.prenom} {c.user?.nom}</div>
                      <div style={{fontSize:11,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lastMsg?.contenu}</div>
                    </div>
                    {c.unread>0&&<span style={{background:"#C8102E",color:"white",borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{c.unread}</span>}
                  </div>
                ))}
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                {!activeConv?(
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#aaa",fontSize:13}}>Sélectionnez une conversation</div>
                ):(
                  <>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{activeConv.user?.prenom} {activeConv.user?.nom}</div>
                      {activeConv.annonce&&<div style={{fontSize:11,color:"#888"}}>Re: {activeConv.annonce?.titre}</div>}
                    </div>
                    <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:8}}>
                      {msgLoading?<div style={{textAlign:"center",color:"#aaa",paddingTop:24}}>Chargement...</div>:
                        convMsgs.map((m,i)=>(
                          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.expediteur_id===user.id?"flex-end":"flex-start"}}>
                            <div className={m.expediteur_id===user.id?"msg-me":"msg-other"}>{m.contenu}</div>
                            <div style={{fontSize:10,color:"#aaa",marginTop:3}}>{new Date(m.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                        ))
                      }
                      <div ref={msgsEndRef}/>
                    </div>
                    <div style={{padding:"10px 14px",borderTop:"1px solid #eee",display:"flex",gap:8,alignItems:"flex-end",flexShrink:0}}>
                      <textarea className="msg-inp" placeholder="Écrire un message..." value={newMsg} onChange={e=>setNewMsg(e.target.value)} rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(activeConv.userId,activeConv.annonce?.id||null);}}}/>
                      <button className="btn btn-red" style={{padding:"10px 14px",borderRadius:22,flexShrink:0,display:"flex",alignItems:"center",gap:6}} onClick={()=>sendMsg(activeConv.userId,activeConv.annonce?.id||null)}><Ic n="send" s={15} c="white"/>Envoyer</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACTER VENDEUR ── */}
      {contactModal&&(
        <div className="overlay" onClick={()=>setContactModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:700}}>Contacter {contactModal.seller?.prenom} {contactModal.seller?.nom}</div>
              {contactModal.annonce&&<div style={{fontSize:12,color:"#888",marginTop:2}}>Re: {contactModal.annonce.title}</div>}
            </div>
            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:14}}>
              <textarea className="inp" placeholder="Votre message..." rows={4} style={{resize:"vertical"}} value={newMsg} onChange={e=>setNewMsg(e.target.value)}/>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-white" style={{flex:1}} onClick={()=>setContactModal(null)}>Annuler</button>
                <button className="btn btn-red" style={{flex:2}} onClick={async()=>{await sendMsg(contactModal.seller?.id,contactModal.annonce?.id||null,newMsg);setContactModal(null);setNewMsg("");}}>Envoyer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PANIER ── */}
      {showCart&&(
        <>
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:250}} onClick={()=>setShowCart(false)}/>
          <div className="sidebar" style={{zIndex:300}}>
            <div className="sidebar-handle"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:700}}>Panier ({cart.length})</div>
              <button onClick={()=>setShowCart(false)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic n="x" s={20} c="#888"/></button>
            </div>
            {cart.length===0?(
              <div style={{textAlign:"center",color:"#aaa",paddingTop:36}}>
                <Ic n="cart" s={36} c="#ddd"/>
                <div style={{fontSize:14,marginTop:12}}>Votre panier est vide</div>
              </div>
            ):(
              <>
                {cart.map(item=>(
                  <div key={item.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #f0f0f0"}}>
                    <div style={{width:46,height:46,background:"#f3f3f3",borderRadius:4,overflow:"hidden",flexShrink:0,border:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {item.photos?.[0]?<img src={item.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<Ic n="img" s={18} c="#bbb"/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{item.title}</div>
                      <div style={{fontSize:11,color:"#888"}}>par {item.seller?.prenom} {item.seller?.nom}</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{item.price.toLocaleString()} FCFA</div>
                    </div>
                    <button onClick={()=>rmCart(item.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,alignSelf:"flex-start"}}><Ic n="x" s={16} c="#aaa"/></button>
                  </div>
                ))}
                <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid #eee"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#555"}}>Sous-total</span><span style={{fontSize:13}}>{total.toLocaleString()} FCFA</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:15,fontWeight:700}}>Total</span><span style={{fontSize:15,fontWeight:700}}>{total.toLocaleString()} FCFA</span></div>
                  <button className="btn btn-red btn-block">Passer la commande</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── SUPPRESSION ── */}
      {delConfirm&&(
        <div className="overlay" onClick={()=>setDelConfirm(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-handle"/>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fafafa",flexShrink:0}}><div style={{fontSize:15,fontWeight:700,color:"#C8102E"}}>Supprimer l'annonce</div></div>
            <div style={{padding:"18px 16px",display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:14,color:"#444",lineHeight:1.7}}>Etes-vous sûr ? Cette action est <strong>irréversible</strong>.</div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-white" style={{flex:1}} onClick={()=>setDelConfirm(null)} disabled={delLoading}>Annuler</button>
                <button className="btn btn-red" style={{flex:1}} onClick={()=>delListing(delConfirm)} disabled={delLoading}>{delLoading?<><span className="spinner"/>Suppression...</>:"Oui, supprimer"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{background:"#232f3e",padding:"18px 16px",textAlign:"center",marginTop:36}}>
        <div style={{color:"white",fontSize:14,fontWeight:600,marginBottom:4}}>Faso_Karanbissi</div>
        <div style={{fontSize:12,color:"#888"}}>Plateforme universitaire · Tous droits réservés</div>
      </footer>
    </div>
  );
}
