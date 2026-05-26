import { useState, useRef } from "react";
import React from "react";

if (!document.getElementById("ql-font")) {
  const l = document.createElement("link");
  l.id = "ql-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";
  document.head.appendChild(l);
}

const QL = {bg:"#F4EFE6",sb:"#8B3A1F",card:"#FFFFFF",inp:"#F5F0E8",br:"#E5DDD2",tx:"#1A1208",txm:"#2C2014",txmt:"#7A6A55",txf:"#9A8A75",ac:"#C8581A",sg:"#4A7A55",cm:"#D4920A",wn:"#B5311A",cr:"#FBF5E8"};
const PC = {Airbnb:{color:"#FF385C",icon:"🏠"},VRBO:{color:"#0059CF",icon:"🏡"},"Booking.com":{color:"#1a6fe0",icon:"🛎"},Direct:{color:"#3A6A45",icon:"✉️"}};
const fmt = n => "$" + Number(n||0).toLocaleString();
const BKS = [
  {id:"B1",guest:"Sarah Chen",platform:"Airbnb",property:"Ocean View Suite",ci:"2026-05-25",co:"2026-05-28",nights:3,total:555,status:"confirmed",code:"4729",email:"sarah@mail.com",phone:"+1 415 555 0192"},
  {id:"B2",guest:"Marcus Webb",platform:"VRBO",property:"Downtown Loft",ci:"2026-05-26",co:"2026-05-30",nights:4,total:660,status:"confirmed",code:"3847",email:"marc@mail.com",phone:"+1 312 555 0847"},
  {id:"B3",guest:"Priya Nair",platform:"Booking.com",property:"Ocean View Suite",ci:"2026-05-29",co:"2026-06-01",nights:3,total:525,status:"pending",code:"8821",email:"priya@mail.com",phone:"+1 646 555 0234"},
  {id:"B4",guest:"Tom Ridley",platform:"Direct",property:"Downtown Loft",ci:"2026-06-02",co:"2026-06-05",nights:3,total:450,status:"confirmed",code:"5533",email:"tom@mail.com",phone:"+1 503 555 0671"},
  {id:"B5",guest:"Aisha Okonkwo",platform:"Airbnb",property:"Downtown Loft",ci:"2026-06-06",co:"2026-06-09",nights:3,total:525,status:"confirmed",code:"2291",email:"aisha@mail.com",phone:"+1 718 555 0413"},
];
const MSGS0 = [
  {id:"M1",guest:"Sarah Chen",platform:"Airbnb",msg:"Hi! What time is check-in?",time:"2h ago",replied:true,reply:"Check-in is 3 PM. Code 4729 arrives 24h before!"},
  {id:"M2",guest:"Marcus Webb",platform:"VRBO",msg:"Is early check-in possible?",time:"5h ago",replied:false,reply:""},
  {id:"M3",guest:"Priya Nair",platform:"Booking.com",msg:"Can you recommend restaurants?",time:"1d ago",replied:true,reply:"Marea for seafood, Sorrento for breakfast!"},
];
const INV0 = [
  {id:"I1",name:"Toilet Paper",cat:"Bathroom",unit:"rolls",stock:24,low:12,qty:48,search:"toilet paper bulk",auto:true,price:28},
  {id:"I2",name:"Paper Towels",cat:"Kitchen",unit:"rolls",stock:8,low:4,qty:12,search:"paper towels 12 pack",auto:true,price:22},
  {id:"I3",name:"Dish Soap",cat:"Kitchen",unit:"bottles",stock:3,low:2,qty:6,search:"dish soap bulk",auto:true,price:18},
  {id:"I4",name:"All-Purpose Cleaner",cat:"Cleaning",unit:"bottles",stock:2,low:2,qty:4,search:"all purpose cleaner bulk",auto:true,price:24},
  {id:"I5",name:"Trash Bags",cat:"General",unit:"bags",stock:30,low:15,qty:60,search:"trash bags bulk",auto:true,price:20},
  {id:"I6",name:"Shampoo",cat:"Bathroom",unit:"bottles",stock:6,low:4,qty:12,search:"hotel shampoo bulk",auto:true,price:25},
  {id:"I7",name:"Conditioner",cat:"Bathroom",unit:"bottles",stock:6,low:4,qty:12,search:"hotel conditioner bulk",auto:true,price:25},
  {id:"I8",name:"Body Wash",cat:"Bathroom",unit:"bottles",stock:4,low:3,qty:12,search:"body wash hotel bulk",auto:true,price:22},
  {id:"I9",name:"Hand Soap",cat:"Bathroom",unit:"pumps",stock:4,low:2,qty:6,search:"hand soap pump bulk",auto:true,price:18},
  {id:"I10",name:"Coffee Pods",cat:"Kitchen",unit:"pods",stock:20,low:10,qty:40,search:"coffee pods bulk",auto:true,price:30},
  {id:"I11",name:"Water Bottles",cat:"Welcome",unit:"bottles",stock:12,low:6,qty:24,search:"water bottles bulk",auto:true,price:15},
  {id:"I12",name:"Welcome Snacks",cat:"Welcome",unit:"packs",stock:5,low:3,qty:10,search:"welcome snack basket",auto:false,price:40},
  {id:"I13",name:"Light Bulbs",cat:"Maintenance",unit:"bulbs",stock:6,low:3,qty:12,search:"led light bulbs 60w bulk",auto:true,price:20},
  {id:"I14",name:"AA Batteries",cat:"Maintenance",unit:"packs",stock:2,low:1,qty:4,search:"AA batteries bulk",auto:true,price:18},
];
const TM0 = [
  {id:"T1",name:"Rosa Martinez",role:"cleaner",phone:"+15550192",rate:85,waKey:"",rating:4.9,jobs:142,owed:0},
  {id:"T2",name:"James Park",role:"cleaner",phone:"+15550847",rate:80,waKey:"",rating:4.7,jobs:98,owed:80},
  {id:"T3",name:"Mike Torres",role:"handyman",phone:"+15550234",rate:95,waKey:"",rating:4.8,jobs:34,owed:0},
  {id:"T4",name:"Fatima Diallo",role:"cleaner",phone:"+15550671",rate:90,waKey:"",rating:5.0,jobs:67,owed:0},
];
const AUTOS0 = [
  {id:"A1",name:"Check-in Instructions",trigger:"24h before check-in",action:"Send welcome + lock code",on:true},
  {id:"A2",name:"Check-out Reminder",trigger:"Morning of check-out",action:"Send check-out reminder",on:true},
  {id:"A3",name:"Schedule Cleaner",trigger:"Booking confirmed",action:"Create cleaning job + notify",on:true},
  {id:"A4",name:"Generate Lock Code",trigger:"Booking confirmed",action:"Issue unique code, expire at checkout",on:true},
  {id:"A5",name:"Review Request",trigger:"24h after check-out",action:"Send 5-star review request",on:true},
  {id:"A6",name:"Low Battery Alert",trigger:"Lock battery below 30%",action:"SMS host immediately",on:false},
  {id:"A7",name:"iCal Auto-Refresh",trigger:"Every 15 minutes",action:"Pull all platform feeds",on:true},
  {id:"A8",name:"Cleaner Pay",trigger:"Clean job marked complete",action:"Trigger Stripe payment",on:true},
  {id:"A9",name:"Guest Portal Link",trigger:"Booking confirmed",action:"Email self-check-in link",on:true},
  {id:"A10",name:"Deposit Release",trigger:"48h after check-out",action:"Auto-release deposit if no damage",on:true},
];
async function aiCall(p){try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:p}]})});const d=await r.json();return d.content[0].text;}catch(e){return "";}}
async function sendWA(ph,k,m){try{await fetch("https://api.callmebot.com/whatsapp.php?phone="+ph+"&text="+encodeURIComponent(m)+"&apikey="+k);return true;}catch(e){return false;}}
const Bdg=({c,ch})=><span style={{background:(c||QL.ac)+"22",color:c||QL.ac,border:"1px solid "+(c||QL.ac)+"44",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",whiteSpace:"nowrap"}}>{ch}</span>;
const Tog=({on,fn})=><button onClick={fn} style={{background:on?QL.ac:QL.br,border:"none",borderRadius:14,width:44,height:24,cursor:"pointer",position:"relative",flexShrink:0}}><span style={{position:"absolute",top:2,left:on?22:2,width:20,height:20,background:"#fff",borderRadius:"50%",transition:"left .2s"}}/></button>;

function TeamTab(){
  const [team,setTeam]=useState(TM0);
  const [toast,setToast]=useState(null);
  const pop=(m,ok=true)=>{setToast({m,ok});setTimeout(()=>setToast(null),2500);};
  const owed=team.reduce((s,t)=>s+t.owed,0);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontSize:13,color:QL.txmt}}>{team.length} members · {"$"+owed} owed</span>
        <a href="https://react-s8a85b1o.stackblitz.io" target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:700,color:QL.ac,textDecoration:"none"}}>Teammate Portal →</a>
      </div>
      {team.filter(t=>t.owed>0).length>0&&<div style={{background:"#FBF3E2",border:"1px solid "+QL.cm+"44",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
        <div style={{fontWeight:700,color:QL.cm,marginBottom:8}}>💳 Payments Due</div>
        {team.filter(t=>t.owed>0).map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+QL.br}}>
            <span style={{fontSize:13,fontWeight:600,color:QL.tx}}>{t.name}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:15,fontWeight:800,color:QL.sg}}>{"$"+t.owed}</span>
              <button style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:QL.sg,color:"#fff"}} onClick={()=>{setTeam(p=>p.map(x=>x.id===t.id?{...x,owed:0}:x));pop("Payment sent to "+t.name);}}>Pay Now</button>
            </div>
          </div>
        ))}
      </div>}
      {team.map(t=>{
        const rc=t.role==="handyman"?QL.cm:QL.sg;
        return <div key={t.id} style={{background:QL.card,border:"1px solid "+QL.br,borderRadius:12,padding:16,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:44,height:44,background:rc+"33",border:"2px solid "+rc,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:rc,fontSize:17}}>{t.name[0]}</div>
              <div>
                <div style={{fontWeight:700,color:QL.tx,fontSize:14}}>{t.name}</div>
                <div style={{fontSize:11,color:QL.txmt}}>{t.phone}</div>
                <div style={{display:"flex",gap:5,marginTop:4}}>
                  <Bdg c={rc} ch={t.role}/>
                  <span style={{fontSize:11,color:QL.txmt}}>{"$"+t.rate+"/job · ★"+t.rating}</span>
                </div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:18,fontWeight:800,color:t.owed>0?QL.cm:"#B0A090"}}>{"$"+t.owed}</div>
              <div style={{fontSize:10,color:QL.txmt}}>owed</div>
            </div>
          </div>
          <div style={{marginTop:10,padding:"7px 11px",background:t.waKey?QL.sg+"11":"#FAEEE9",border:"1px solid "+(t.waKey?QL.sg+"44":QL.wn+"33"),borderRadius:7}}>
            <span style={{fontSize:12,color:t.waKey?QL.sg:QL.wn}}>{t.waKey?"✓ WhatsApp connected":"⚠ WhatsApp not set up"}</span>
          </div>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            <button style={{padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:"transparent",color:QL.ac}} onClick={async()=>{if(!t.waKey){pop("No key for "+t.name,false);return;}await sendWA(t.phone,t.waKey,"Hi "+t.name.split(" ")[0]+"! New job in HostPilot. Log in to confirm.");pop("WhatsApp sent!");}}>💬 WhatsApp</button>
            <button style={{padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:QL.inp,color:QL.txm}} onClick={()=>{const k=prompt("WhatsApp API key for "+t.name+":");if(k){setTeam(p=>p.map(x=>x.id===t.id?{...x,waKey:k}:x));pop("Key saved ✓");}}}>⚙ Set WA Key</button>
            {t.owed>0&&<button style={{padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:QL.sg,color:"#fff"}} onClick={()=>{setTeam(p=>p.map(x=>x.id===t.id?{...x,owed:0}:x));pop("Paid!");}}>{"💳 Pay $"+t.owed}</button>}
          </div>
        </div>;
      })}
      <div style={{background:"#F0F5F0",border:"1px solid "+QL.sg+"44",borderRadius:12,padding:16,marginTop:4}}>
        <div style={{fontWeight:700,color:QL.tx,marginBottom:8}}>💬 Free WhatsApp via CallMeBot</div>
        {["1. Cleaner saves: +34 644 60 09 78","2. They WhatsApp: I allow callmebot to send me messages","3. They receive an API key and share it with you","4. Click Set WA Key above to activate"].map((s,i)=>(
          <div key={i} style={{fontSize:12,color:QL.txm,padding:"6px 10px",background:QL.card,borderRadius:6,marginBottom:4}}>{s}</div>
        ))}
        <div style={{marginTop:8,fontSize:12,color:QL.sg,fontWeight:600}}>✓ 100% free forever — no fees</div>
      </div>
      {toast&&<div style={{position:"fixed",bottom:20,right:20,background:toast.ok?QL.sg:QL.wn,color:"#fff",padding:"10px 16px",borderRadius:9,fontWeight:700,fontSize:12,zIndex:300}}>{toast.m}</div>}
    </div>
  );
}

function InventoryTab(){
  const [inv,setInv]=useState(INV0);
  const [filter,setFilter]=useState("all");
  const [toast,setToast]=useState(null);
  const pop=(m,ok=true)=>{setToast({m,ok});setTimeout(()=>setToast(null),2500);};
  const low=inv.filter(i=>i.stock<=i.low);
  const cats=["all","low",...[...new Set(inv.map(i=>i.cat))]];
  const shown=filter==="all"?inv:filter==="low"?low:inv.filter(i=>i.cat===filter);
  const upd=(id,v)=>setInv(p=>p.map(i=>i.id===id?{...i,stock:Math.max(0,Number(v)||0)}:i));
  const order=(item)=>{window.open("https://www.amazon.com/s?k="+encodeURIComponent(item.search),"_blank");setInv(p=>p.map(i=>i.id===item.id?{...i,ordered:new Date().toLocaleDateString()}:i));pop("Opening Amazon for "+item.name);};
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11,marginBottom:14}}>
        {[{l:"Total Items",v:inv.length,c:QL.ac},{l:"Low Stock",v:low.length,c:low.length>0?QL.wn:QL.sg},{l:"Auto-Order",v:inv.filter(i=>i.auto).length,c:QL.sg}].map((s,i)=>(
          <div key={i} style={{background:QL.card,border:"1px solid "+QL.br,borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:QL.txmt,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>
      {low.length>0&&<div style={{background:"#FAEEE9",border:"1px solid "+QL.wn+"44",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontWeight:700,color:QL.wn}}>{low.length+" items need reordering"}</span>
          <button style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:QL.wn,color:"#fff"}} onClick={()=>{low.filter(i=>i.auto).forEach((item,idx)=>setTimeout(()=>window.open("https://www.amazon.com/s?k="+encodeURIComponent(item.search),"_blank"),idx*700));pop("Opening Amazon...");}}>🛒 Order All</button>
        </div>
        {low.slice(0,4).map(i=><div key={i.id} style={{fontSize:12,color:QL.wn,padding:"2px 0"}}>{i.name+" — "+i.stock+" "+i.unit+" left"}</div>)}
      </div>}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
        {cats.map(f=><button key={f} style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(filter===f?QL.ac:QL.br),cursor:"pointer",fontSize:12,fontWeight:filter===f?700:400,background:filter===f?QL.ac:QL.card,color:filter===f?"#fff":QL.txmt,whiteSpace:"nowrap"}} onClick={()=>setFilter(f)}>{f==="low"?"Low ("+low.length+")":f==="all"?"All":f}</button>)}
      </div>
      {shown.map(item=>{
        const isLow=item.stock<=item.low;
        const sc=isLow?QL.wn:item.stock<=item.low*2?QL.cm:QL.sg;
        const pct=Math.min(100,Math.round(item.stock/Math.max(item.qty,1)*100));
        return <div key={item.id} style={{background:QL.card,border:"1px solid "+QL.br,borderRadius:12,padding:14,marginBottom:10,borderLeft:"3px solid "+sc}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                <span style={{fontWeight:700,fontSize:13,color:QL.tx}}>{item.name}</span>
                <Bdg c={QL.ac} ch={item.cat}/>
                {item.auto&&<Bdg c={QL.sg} ch="AUTO"/>}
                {isLow&&<Bdg c={QL.wn} ch="LOW"/>}
              </div>
              <div style={{fontSize:11,color:QL.txmt}}>{"Reorder at "+item.low+" · Order: "+item.qty+" · ~$"+item.price}</div>
              {item.ordered&&<div style={{fontSize:11,color:QL.sg,marginTop:2}}>{"Last ordered: "+item.ordered}</div>}
            </div>
            <div style={{textAlign:"right",marginLeft:12}}>
              <div style={{fontSize:22,fontWeight:900,color:sc}}>{item.stock}</div>
              <div style={{fontSize:10,color:QL.txmt}}>{item.unit}</div>
            </div>
          </div>
          <div style={{margin:"10px 0",height:5,background:QL.br,borderRadius:3,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:sc,borderRadius:3}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button style={{width:28,height:28,borderRadius:6,border:"1px solid "+QL.br,background:QL.inp,cursor:"pointer",fontSize:16,fontWeight:700,color:QL.tx}} onClick={()=>upd(item.id,item.stock-1)}>-</button>
              <span style={{fontSize:14,fontWeight:700,color:QL.tx,minWidth:30,textAlign:"center"}}>{item.stock}</span>
              <button style={{width:28,height:28,borderRadius:6,border:"1px solid "+QL.br,background:QL.inp,cursor:"pointer",fontSize:16,fontWeight:700,color:QL.tx}} onClick={()=>upd(item.id,item.stock+1)}>+</button>
            </div>
            <button style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:isLow?QL.wn:"transparent",color:isLow?"#fff":QL.ac}} onClick={()=>order(item)}>{isLow?"🛒 Order Now":"🛒 Amazon"}</button>
          </div>
        </div>;
      })}
      <div style={{background:"#F0F5F0",border:"1px solid "+QL.sg+"44",borderRadius:12,padding:16,marginTop:4}}>
        <div style={{fontWeight:700,color:QL.tx,marginBottom:6}}>🛒 Amazon Auto-Reorder</div>
        <div style={{fontSize:13,color:QL.txm,lineHeight:1.7}}>When stock hits threshold, click Order Now. For zero-click ordering, use Amazon Business Subscribe and Save.</div>
      </div>
      {toast&&<div style={{position:"fixed",bottom:20,right:20,background:toast.ok?QL.sg:QL.wn,color:"#fff",padding:"10px 16px",borderRadius:9,fontWeight:700,fontSize:12,zIndex:300}}>{toast.m}</div>}
    </div>
  );
}

export default function HostPilot(){
  const [tab,setTab]=useState("dash");
  const [bks,setBks]=useState(BKS);
  const [msgs,setMsgs]=useState(MSGS0);
  const [autos,setAutos]=useState(AUTOS0);
  const [toast,setToast]=useState(null);
  const [replyTo,setReplyTo]=useState(null);
  const [draft,setDraft]=useState("");
  const [aiSpin,setAiSpin]=useState(false);
  const [aiOpen,setAiOpen]=useState(false);
  const [aiQ,setAiQ]=useState("");
  const [aiR,setAiR]=useState("");
  const [bkOpen,setBkOpen]=useState(false);
  const [newBk,setNewBk]=useState({guest:"",ci:"",co:"",total:""});
  const pop=(m,ok=true)=>{setToast({m,ok});setTimeout(()=>setToast(null),3000);};
  const rev=bks.reduce((s,b)=>s+(b.total||0),0);
  const unread=msgs.filter(m=>!m.replied).length;

  const SB={
    app:{fontFamily:"'DM Sans','Segoe UI',sans-serif",display:"flex",height:"100vh",background:QL.bg,color:QL.tx,overflow:"hidden"},
    sb:{width:220,background:QL.sb,borderRight:"none",boxShadow:"4px 0 20px rgba(26,18,8,0.12)",display:"flex",flexDirection:"column",flexShrink:0},
    tb:{background:"#F4EFE6",borderBottom:"1px solid #E5DDD2",padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0},
    body:{flex:1,overflowY:"auto",padding:22},
    card:{background:QL.card,border:"1px solid "+QL.br,borderRadius:12,padding:18,marginBottom:12},
    inp:{background:QL.inp,border:"1.5px solid "+QL.br,borderRadius:8,padding:"9px 11px",color:QL.tx,fontSize:14,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"},
    btn:(v)=>({padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:v==="p"?QL.ac:v==="g"?QL.sg:v==="ghost"?"transparent":QL.inp,color:["p","g"].includes(v)?"#fff":v==="ghost"?QL.ac:QL.txm}),
    modal:{position:"fixed",inset:0,background:"rgba(26,18,8,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200},
    mbox:{background:QL.card,border:"1px solid "+QL.br,borderRadius:16,padding:24,width:500,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(26,18,8,0.2)"},
  };

  const NAV=[
    {id:"dash",label:"Dashboard",e:"🏠"},
    {id:"bookings",label:"Bookings",e:"📅",badge:bks.length},
    {id:"messages",label:"Messages",e:"💬",badge:unread},
    {id:"cleaning",label:"Cleaning",e:"🧹"},
    {id:"automations",label:"Automations",e:"⚡"},
    {id:"team",label:"Team",e:"👥"},
    {id:"inventory",label:"Inventory",e:"📦"},
    {id:"settings",label:"Settings",e:"⚙️"},
  ];

  const Dash=()=>(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:14}}>
        {[{l:"Revenue",v:fmt(rev),c:QL.ac},{l:"Bookings",v:bks.length,c:QL.sg},{l:"Unread",v:unread,c:unread>0?QL.cm:QL.sg},{l:"Properties",v:2,c:"#D4733A"}].map((s,i)=>(
          <div key={i} style={{background:QL.card,border:"1px solid "+QL.br,borderRadius:12,padding:16}}>
            <div style={{fontSize:11,color:QL.txmt,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.c,marginTop:5}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <div style={SB.card}>
          <div style={{fontSize:16,fontWeight:400,color:"#1A1208",marginBottom:12,fontFamily:"'DM Serif Display',serif"}}>Upcoming Check-ins</div>
          {bks.sort((a,b)=>new Date(a.ci)-new Date(b.ci)).slice(0,5).map(b=>(
            <div key={b.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+QL.br}}>
              <div><div style={{fontWeight:700,fontSize:14,color:QL.tx}}>{b.guest}</div><div style={{fontSize:12,color:QL.txmt}}>{b.property+" · "+b.ci}</div></div>
              <div style={{textAlign:"right"}}><Bdg c={PC[b.platform]?.color} ch={b.platform}/><div style={{fontSize:12,color:QL.txmt,marginTop:3}}>{fmt(b.total)}</div></div>
            </div>
          ))}
        </div>
        <div style={SB.card}>
          <div style={{fontSize:16,fontWeight:400,color:"#1A1208",marginBottom:12,fontFamily:"'DM Serif Display',serif"}}>Platform Revenue</div>
          {Object.keys(PC).map(pl=>{
            const tot=bks.filter(b=>b.platform===pl).reduce((s,b)=>s+(b.total||0),0);
            const n=bks.filter(b=>b.platform===pl).length;
            return <div key={pl} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+QL.br}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>{PC[pl].icon}</span><span style={{fontSize:13,color:PC[pl].color,fontWeight:700}}>{pl}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:QL.txmt}}>{n+" bk"}</span><span style={{fontSize:13,fontWeight:700,color:QL.sg}}>{fmt(tot)}</span></div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );

  const Bookings=()=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:13,color:QL.txmt}}>{bks.length+" bookings · "+fmt(rev)}</span>
        <button style={SB.btn("ghost")} onClick={()=>setBkOpen(true)}>+ Add Direct</button>
      </div>
      {bks.sort((a,b)=>new Date(a.ci)-new Date(b.ci)).map(b=>(
        <div key={b.id} style={{...SB.card,borderLeft:"3px solid "+(PC[b.platform]?.color||QL.ac),marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:5}}>
                <span style={{fontWeight:800,fontSize:14,color:QL.tx}}>{b.guest}</span>
                <Bdg c={PC[b.platform]?.color} ch={b.platform}/>
                <Bdg c={b.status==="confirmed"?QL.sg:QL.cm} ch={b.status}/>
              </div>
              <div style={{fontSize:13,color:QL.txm}}>{"🏠 "+b.property+" · "+b.ci+" → "+b.co+" · "+b.nights+" nights"}</div>
              <div style={{fontSize:12,color:QL.txmt,marginTop:2}}>{b.email}</div>
              <div style={{fontSize:12,color:QL.txmt,marginTop:2}}>{"🔐 Lock: "}<strong style={{color:QL.ac,letterSpacing:"0.12em"}}>{b.code}</strong></div>
            </div>
            <div style={{fontSize:20,fontWeight:900,color:QL.sg,marginLeft:12}}>{fmt(b.total)}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const Messages=()=>(
    <div>
      {unread>0&&<div style={{background:"#FBF3E2",border:"1px solid "+QL.cm+"44",borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:13,color:QL.cm,fontWeight:600}}>{unread+" message"+(unread>1?"s":"")+" need a reply"}</div>}
      {msgs.map(msg=>(
        <div key={msg.id} style={{...SB.card,borderLeft:"3px solid "+(msg.replied?QL.sg:QL.cm),marginBottom:9}}>
          <div style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
            <div style={{width:36,height:36,background:QL.ac+"22",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:QL.ac,fontSize:14,flexShrink:0}}>{msg.guest[0]}</div>
            <div><div style={{fontWeight:700,color:QL.tx,fontSize:14}}>{msg.guest}</div><div style={{fontSize:11,color:QL.txmt}}>{msg.time}</div></div>
          </div>
          <div style={{background:QL.inp,borderRadius:8,padding:"10px 12px",fontSize:13,color:QL.txm,lineHeight:1.6}}>{msg.msg}</div>
          {msg.replied&&<div style={{marginTop:7,background:QL.cr,borderLeft:"3px solid "+QL.sg,padding:"8px 12px",fontSize:13,color:QL.txm}}>{msg.reply}</div>}
          {!msg.replied&&replyTo!==msg.id&&<div style={{display:"flex",gap:8,marginTop:9}}>
            <button style={SB.btn()} onClick={()=>{setReplyTo(msg.id);setDraft("");}}>Reply</button>
            <button style={SB.btn("ghost")} onClick={async()=>{setAiSpin(true);setReplyTo(msg.id);const t=await aiCall("STR host. Guest: "+msg.msg+". Reply warmly in 2 sentences.");setDraft(t);setAiSpin(false);}}>⚡ AI Draft</button>
          </div>}
          {replyTo===msg.id&&<div style={{marginTop:10}}>
            {aiSpin?<div style={{padding:10,textAlign:"center",fontSize:13,color:QL.txmt}}>✨ Drafting…</div>
              :<textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={3} style={{...SB.inp,resize:"vertical"}}/>}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button style={SB.btn("g")} onClick={()=>{setMsgs(m=>m.map(x=>x.id===msg.id?{...x,replied:true,reply:draft}:x));setReplyTo(null);setDraft("");pop("Reply sent");}}>Send</button>
              <button style={SB.btn()} onClick={()=>setReplyTo(null)}>Cancel</button>
            </div>
          </div>}
        </div>
      ))}
    </div>
  );

  const Cleaning=()=>(
    <div>
      {[{prop:"Ocean View Suite",date:"2026-05-28",cleaner:"Rosa Martinez",status:"scheduled",pct:0,rate:85},{prop:"Downtown Loft",date:"2026-05-30",cleaner:"James Park",status:"in-progress",pct:40,rate:80}].map((j,i)=>(
        <div key={i} style={{...SB.card,borderLeft:"3px solid "+(j.status==="in-progress"?QL.cm:QL.ac)}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div><div style={{fontWeight:700,color:QL.tx,fontSize:14}}>{j.prop}</div><div style={{fontSize:12,color:QL.txmt}}>{j.date+" · "+j.cleaner}</div></div>
            <Bdg c={j.status==="in-progress"?QL.cm:QL.ac} ch={j.status}/>
          </div>
          {j.pct>0&&<div style={{height:5,background:QL.br,borderRadius:3,overflow:"hidden",marginBottom:10}}><div style={{width:j.pct+"%",height:"100%",background:QL.cm}}/></div>}
          <div style={{display:"flex",gap:8}}>
            <button style={{...SB.btn(),flex:1,justifyContent:"center"}}>View Checklist</button>
            <button style={{...SB.btn("g"),flex:1,justifyContent:"center"}} onClick={()=>pop("Job complete! Payment sent to "+j.cleaner+" ✓")}>Mark Done + Pay</button>
          </div>
        </div>
      ))}
    </div>
  );

  const Automations=()=>(
    <div>
      <div style={{background:QL.cr,border:"1px solid "+QL.br,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:14,color:QL.tx,marginBottom:3}}>🤖 Automation Engine</div>
        <div style={{fontSize:12,color:QL.txmt}}>{autos.filter(a=>a.on).length+"/"+autos.length+" rules active"}</div>
      </div>
      {autos.map(a=>(
        <div key={a.id} style={{...SB.card,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:a.on?1:0.5,marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:QL.tx}}>{a.name}</div>
            <div style={{fontSize:11,color:QL.txmt}}>{"Trigger: "+a.trigger}</div>
            <div style={{fontSize:11,color:QL.txf}}>{"Action: "+a.action}</div>
          </div>
          <Tog on={a.on} fn={()=>setAutos(x=>x.map(y=>y.id===a.id?{...y,on:!y.on}:y))}/>
        </div>
      ))}
    </div>
  );

  const Settings=()=>{
    const [sec,setSec]=useState("property");
    const [cfg,setCfg]=useState({name:"",addr:"",rate:"",wifi:"",wifiPw:"",airbnbIcal:"",vrboIcal:"",bookingIcal:"",seamKey:"",seamLock:"",seamTherm:"",stripe:"",twilioSid:"",twilioToken:"",twilioFrom:"",priceLabsKey:"",hostName:"",hostPhone:""});
    const [saved,setSaved]=useState(false);
    const save=()=>{localStorage.setItem("hp_cfg",JSON.stringify(cfg));setSaved(true);setTimeout(()=>setSaved(false),2500);};
    const upd=(f,v)=>setCfg(c=>({...c,[f]:v}));
    const F=({label,field,ph,type="text"})=>(
      <div style={{marginBottom:12}}>
        <label style={{fontSize:10,fontWeight:700,color:QL.txmt,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,display:"block"}}>{label}</label>
        <input type={type} style={SB.inp} placeholder={ph} value={cfg[field]} onChange={e=>upd(field,e.target.value)}/>
      </div>
    );
    const hint=t=><div style={{fontSize:11,color:QL.txf,marginTop:-8,marginBottom:12,lineHeight:1.5}}>{t}</div>;
    const secs=[{id:"property",l:"🏠 Property"},{id:"ical",l:"📅 iCal Sync"},{id:"locks",l:"🔒 Smart Locks"},{id:"thermostat",l:"🌡 Thermostat"},{id:"stripe",l:"💳 Stripe"},{id:"sms",l:"📱 Twilio SMS"},{id:"pricing",l:"💰 PriceLabs"},{id:"host",l:"👤 Host Profile"}];
    return (
      <div style={{display:"flex",gap:20}}>
        <div style={{width:180,flexShrink:0}}>
          <div style={{fontSize:10,color:QL.txmt,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Settings</div>
          {secs.map(s=><div key={s.id} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:sec===s.id?700:400,color:sec===s.id?QL.tx:QL.txmt,background:sec===s.id?"rgba(139,115,85,0.1)":"transparent",borderLeft:"2px solid "+(sec===s.id?QL.ac:"transparent"),borderRadius:"0 6px 6px 0",marginBottom:2}} onClick={()=>setSec(s.id)}>{s.l}</div>)}
          <button onClick={save} style={{width:"100%",marginTop:16,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:saved?QL.sg:QL.ac,color:"#fff"}}>{saved?"✓ Saved!":"Save Settings"}</button>
        </div>
        <div style={{flex:1}}>
          {sec==="property"&&<div><F label="Property Name" field="name" ph="Ocean View Suite"/><F label="Full Address" field="addr" ph="123 Main St, Miami FL"/><F label="Base Nightly Rate ($)" field="rate" ph="175" type="number"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><F label="WiFi Name" field="wifi" ph="MyWifi"/><F label="WiFi Password" field="wifiPw" ph="password123"/></div></div>}
          {sec==="ical"&&<div><F label="Airbnb iCal URL" field="airbnbIcal" ph="https://www.airbnb.com/calendar/ical/..."/>{hint("Airbnb: Listing → Calendar → Availability → Export Calendar")}<F label="VRBO iCal URL" field="vrboIcal" ph="https://www.vrbo.com/icalendar/..."/>{hint("VRBO: Listing → Calendar → Import/Export → Export")}<F label="Booking.com iCal URL" field="bookingIcal" ph="https://ical.booking.com/v1/export..."/>{hint("Booking.com: Property → Calendar → Sync → Export")}</div>}
          {sec==="locks"&&<div><F label="Seam API Key" field="seamKey" ph="seam_sk_xxxxxxxxxxxx"/>{hint("getseam.com → Dashboard → API Keys → Create Key")}<F label="Lock Device ID" field="seamLock" ph="device_abc123..."/>{hint("getseam.com → Devices → click your lock → copy Device ID. Supports August, Schlage, Yale + 50 more brands")}</div>}
          {sec==="thermostat"&&<div><F label="Thermostat Device ID" field="seamTherm" ph="device_xyz789..."/>{hint("getseam.com → Devices → connect thermostat (Ecobee, Nest, Honeywell, Sensi) → copy Device ID")}</div>}
          {sec==="stripe"&&<div><F label="Stripe Secret Key" field="stripe" ph="sk_live_xxxxxxxxxxxx" type="password"/>{hint("stripe.com → Developers → API Keys → Reveal secret key")}</div>}
          {sec==="sms"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><F label="Twilio Account SID" field="twilioSid" ph="ACxxxxxxxxxxxxxxxx"/><F label="Auth Token" field="twilioToken" ph="xxxxxxxxxxxxxxxx" type="password"/></div><F label="Twilio Phone Number" field="twilioFrom" ph="+15550001234"/>{hint("twilio.com → Console Dashboard. Note: requires A2P 10DLC registration for automated SMS.")}</div>}
          {sec==="pricing"&&<div><F label="PriceLabs API Key" field="priceLabsKey" ph="pl_xxxxxxxxxxxx" type="password"/>{hint("pricelabs.co → Account Settings → API Access → Generate Key. Auto-adjusts rates on Airbnb and VRBO daily.")}</div>}
          {sec==="host"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><F label="Your Name" field="hostName" ph="Gabriela"/><F label="Your Phone" field="hostPhone" ph="+1 555 000 0000"/></div></div>}
        </div>
      </div>
    );
  };

  const TITLES={dash:"Dashboard",bookings:"Bookings",messages:"Messages",cleaning:"Cleaning",automations:"Automations",team:"Team and Payouts",inventory:"Inventory",settings:"Settings"};
  const RENDER={dash:<Dash/>,bookings:<Bookings/>,messages:<Messages/>,cleaning:<Cleaning/>,automations:<Automations/>,team:<TeamTab/>,inventory:<InventoryTab/>,settings:<Settings/>};

  return (
    <div style={SB.app}>
      <div style={SB.sb}>
        <div style={{padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,240,220,0.15)"}}>
          <div style={{fontSize:17,fontWeight:400,color:"#FFF5EC",letterSpacing:"-0.2px",fontFamily:"'DM Serif Display',serif"}}>🏡 HostPilot Pro</div>
          <div style={{fontSize:9,color:"rgba(255,240,220,0.55)",fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",marginTop:4}}>STR Management Suite</div>
        </div>
        <nav style={{flex:1,marginTop:8,overflowY:"auto"}}>
          {NAV.map(n=>(
            <div key={n.id} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",cursor:"pointer",color:tab===n.id?"#FFF5EC":"rgba(255,240,220,0.65)",background:tab===n.id?"rgba(255,240,220,0.12)":"transparent",borderLeft:"2px solid "+(tab===n.id?"#D4920A":"transparent"),fontSize:14,fontWeight:tab===n.id?700:400,transition:"all .12s"}} onClick={()=>setTab(n.id)}>
              <span style={{fontSize:15}}>{n.e}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.badge>0&&<span style={{background:n.id==="messages"?"#B5311A":"#D4920A",color:"#fff",borderRadius:9,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{n.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,240,220,0.15)"}}>
          {Object.entries(PC).map(([pl,cfg])=>(
            <div key={pl} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{width:6,height:6,background:cfg.color,borderRadius:"50%"}}/>
              <span style={{fontSize:11,color:"rgba(255,240,220,0.7)",flex:1}}>{pl}</span>
              <span style={{fontSize:10,color:QL.txf}}>{bks.filter(b=>b.platform===pl).length+" bk"}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={SB.tb}>
          <div style={{fontSize:17,fontWeight:400,color:"#1A1208",fontFamily:"'DM Serif Display',serif"}}>{TITLES[tab]}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button style={SB.btn("ghost")} onClick={()=>{setAiOpen(true);setAiQ("");setAiR("");}}>⚡ Copilot</button>
            <button style={SB.btn("p")} onClick={()=>setBkOpen(true)}>+ Booking</button>
            <div style={{width:30,height:30,background:QL.ac,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800}}>G</div>
          </div>
        </div>
        <div style={SB.body}>{RENDER[tab]||null}</div>
      </div>
      {aiOpen&&<div style={SB.modal} onClick={e=>e.target===e.currentTarget&&setAiOpen(false)}>
        <div style={SB.mbox}>
          <div style={{fontWeight:800,fontSize:16,color:QL.tx,marginBottom:16}}>🤖 AI Copilot</div>
          <div style={{display:"flex",gap:8}}>
            <input style={{...SB.inp,flex:1}} placeholder="Ask anything about your STR business..." value={aiQ} onChange={e=>setAiQ(e.target.value)} onKeyDown={async e=>{if(e.key==="Enter"&&aiQ){setAiSpin(true);const t=await aiCall("STR host. Revenue: "+fmt(rev)+". "+aiQ);setAiR(t);setAiSpin(false);}}}/>
            <button style={SB.btn("p")} onClick={async()=>{if(!aiQ)return;setAiSpin(true);const t=await aiCall("STR host. Revenue: "+fmt(rev)+". "+aiQ);setAiR(t);setAiSpin(false);}}>Ask</button>
          </div>
          {aiSpin&&<div style={{padding:16,textAlign:"center",color:QL.txmt,fontSize:13,marginTop:12}}>✨ Thinking…</div>}
          {aiR&&<div style={{marginTop:12,background:QL.inp,borderRadius:9,padding:"12px 14px",fontSize:13,color:QL.txm,lineHeight:1.75}}>{aiR}</div>}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}>
            <button style={SB.btn()} onClick={()=>setAiOpen(false)}>Close</button>
          </div>
        </div>
      </div>}
      {bkOpen&&<div style={SB.modal} onClick={e=>e.target===e.currentTarget&&setBkOpen(false)}>
        <div style={SB.mbox}>
          <div style={{fontWeight:800,fontSize:16,color:QL.tx,marginBottom:18}}>Add Direct Booking</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={{fontSize:10,fontWeight:700,color:QL.txmt,textTransform:"uppercase",marginBottom:4,display:"block"}}>Guest Name</label><input style={SB.inp} placeholder="Jane Smith" value={newBk.guest} onChange={e=>setNewBk(p=>({...p,guest:e.target.value}))}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:10,fontWeight:700,color:QL.txmt,textTransform:"uppercase",marginBottom:4,display:"block"}}>Check-in</label><input type="date" style={SB.inp} value={newBk.ci} onChange={e=>setNewBk(p=>({...p,ci:e.target.value}))}/></div>
              <div><label style={{fontSize:10,fontWeight:700,color:QL.txmt,textTransform:"uppercase",marginBottom:4,display:"block"}}>Check-out</label><input type="date" style={SB.inp} value={newBk.co} onChange={e=>setNewBk(p=>({...p,co:e.target.value}))}/></div>
            </div>
            <div><label style={{fontSize:10,fontWeight:700,color:QL.txmt,textTransform:"uppercase",marginBottom:4,display:"block"}}>Total Payout ($)</label><input type="number" style={SB.inp} placeholder="450" value={newBk.total} onChange={e=>setNewBk(p=>({...p,total:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
            <button style={SB.btn()} onClick={()=>setBkOpen(false)}>Cancel</button>
            <button style={SB.btn("g")} onClick={()=>{if(!newBk.guest||!newBk.ci||!newBk.co)return;const nights=Math.ceil((new Date(newBk.co)-new Date(newBk.ci))/86400000);setBks(p=>[{id:"D"+Date.now(),guest:newBk.guest,platform:"Direct",property:"Ocean View Suite",ci:newBk.ci,co:newBk.co,nights,total:Number(newBk.total)||nights*150,status:"confirmed",code:String(Math.floor(1000+Math.random()*9000)),email:"",phone:""},...p]);setBkOpen(false);setNewBk({guest:"",ci:"",co:"",total:""});pop("Booking added!");}}>Add Booking</button>
          </div>
        </div>
      </div>}
      {toast&&<div style={{position:"fixed",bottom:20,right:20,background:toast.ok?QL.sg:QL.wn,color:"#fff",padding:"10px 16px",borderRadius:9,fontWeight:700,fontSize:13,zIndex:300,boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>{toast.m}</div>}
    </div>
  );
}
