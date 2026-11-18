import {useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Eye, EyeOff, LockKeyhole, Sparkles, MailCheck} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {ApiError} from '../services/api';

export default function Login(){
 const {login,register}=useAuth();
 const nav=useNavigate();
 const [mode,setMode]=useState<'login'|'register'>('login');
 const [name,setName]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [show,setShow]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [unverified,setUnverified]=useState(false);
 const [pending,setPending]=useState('');
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');setUnverified(false);
  try{
   if(mode==='register'){
    const result=await register(name,email,password);
    setPending(result.email);
   }else{
    await login(email,password);nav('/perfil',{replace:true});
   }
  }catch(e){setError((e as Error).message);if(e instanceof ApiError&&e.status===403)setUnverified(true)}
  finally{setBusy(false)}
 }
 return <div className="auth-layout">
  <section className="auth-decor"><Sparkles size={38}/><h1>Seu universo.<br/><span className="pink">Suas histórias.</span></h1><p>Explore, acompanhe e organize seus animes, mangás e light novels. Sua conta agora é protegida com confirmação de e-mail.</p><div className="decor-dots">✦　✧　✦</div></section>
  <section className="panel auth-form">
   {pending?<><MailCheck size={44} className="pink"/><h1>Verifique seu e-mail</h1><p>Enviamos um link de confirmação para <strong>{pending}</strong>. Acesse sua caixa de entrada ou spam; o link expira em 24 horas.</p><p className="muted">Você poderá entrar após confirmar o endereço.</p><Link className="btn" to={'/reenviar-verificacao?email='+encodeURIComponent(pending)}>Reenviar confirmação</Link><button className="text-action" onClick={()=>{setPending('');setMode('login')}}>Voltar ao login</button></>:
    <><span className="eyebrow"><LockKeyhole size={14}/> SUA CONTA OTAKUVAULT</span><h1>{mode==='login'?'Bem-vindo de volta':'Crie sua conta'}</h1><p className="muted">{mode==='login'?'Entre para continuar sua jornada.':'Enviaremos um link para confirmar seu e-mail antes de ativar a conta.'}</p>
    <form onSubmit={submit}>
     {mode==='register'&&<label>Nome<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>}
     <label>E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label>
     <label>Senha<div className="password-field"><input required type={show?'text':'password'} minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres"/><button type="button" aria-label={show?'Esconder senha':'Mostrar senha'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
     {error&&<p className="error" role="alert">{error}</p>}
     {unverified&&<Link className="text-action" to={'/reenviar-verificacao?email='+encodeURIComponent(email)}>E-mail não confirmado? Reenviar link</Link>}
     <button className="btn" disabled={busy}>{busy?'Processando...':mode==='login'?'Entrar':'Criar conta e verificar e-mail'}</button>
    </form>
    <button className="text-action" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setUnverified(false)}}>{mode==='login'?'Não tem conta? Cadastre-se':'Já tem uma conta? Entrar'}</button>
    <Link className="text-action" to="/esqueci-senha">Esqueceu a senha?</Link><Link className="text-action" to="/">Continuar como visitante</Link></>}
  </section>
 </div>;
}
