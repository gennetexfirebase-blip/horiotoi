"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function ProfilePage() {
  const [username,setUsername]=useState(""); const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const router=useRouter();
  useEffect(()=>{fetch("/api/user/profile").then(r=>r.json()).then(p=>{setUsername(p.username||"");setEmail(p.email||"")})},[]);
  async function save(){setMessage("");const response=await fetch("/api/user/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({username})});const data=await response.json();if(!response.ok)return setMessage(data.error||"Хадгалсангүй");setMessage("Username хадгалагдлаа");router.push(new URLSearchParams(window.location.search).get("next")||"/my-posts");router.refresh()}
  return <section className="profile-page shell"><div><span>PROFILE</span><h1>Нийтлэгчийн нэр</h1><p>Таны нийтлэл дээр энэ username харагдана.</p><label>Gmail<input value={email} disabled /></label><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={40} /></label>{message?<p>{message}</p>:null}<button type="button" onClick={save}>Хадгалах</button></div></section>;
}

