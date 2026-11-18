import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {CheckCircle2, MailCheck, MailQuestion, KeyRound, LockKeyhole, Sparkles} from 'lucide-react';
import {api} from '../services/api';

function Layout({title,description,children}:{title:string;description:string;children:ReactNode}){
 return <div className="auth-layout"><section className="auth-decor"><Sparkles size={38}/><h1>Otaku<span className="pink">Vault</span></h1><p>Sua biblioteca e comunidade ficam mais seguras com a confirmação do endereço de e-mail.</p><div className="decor-dots">✦　✧　✦</div></section><section className="panel auth-form"><span className="eyebrow"><LockKeyhole size={14}/> SEGURANÇA DA CONTA</span><h1>{title}</h1><p className="muted">{description}</p>{children}<Link to="/login" className="text-action">Voltar ao login</Link></section></div>;
}
function useOneTimeToken(){
 const [token]=useState(()=>new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token')||new URLSearchParams(window.location.search).get('token')||'');
 useEffect(()=>{if(token)window.history.replaceState(null,'',window.location.pathname)},[token]);
 return token;
}
export function VerifyEmail(){
 const token=useOneTimeToken(),once=useRef(false);
 const [busy,setBusy]=useState(Boolean(token));const [message,setMessage]=useState('');const [error,setError]=useState('');
 useEffect(()=>{if(!token||once.current)return;once.current=true;api<{message:string}>('/auth/verify-email',{method:'POST',body:JSON.stringify({token})}).then(r=>setMessage(r.message)).catch(e=>setError((e as Error).message)).finally(()=>setBusy(false))},[token]);
 return <Layout title="Confirmar e-mail" description="A confirmação ativa sua conta para login, listas, reviews e comunidade.">
  {busy&&<p role="status">Verificando seu link...</p>}
  {message&&<><CheckCircle2 className="auth-success-icon" size={44}/><p className="success-message" role="status">{message}</p><Link className="btn" to="/login">Entrar no OtakuVault</Link></>}
  {!busy&&!message&&<><p className="error" role="alert">{error||'Link de verificação ausente.'}</p><Link className="btn outline" to="/reenviar-verificacao">Solicitar outro link</Link></>}
 </Layout>;
}
function EmailRequest({kind}:{kind:'verify'|'reset'}){
 const [email,setEmail]=useState(()=>new URLSearchParams(window.location.search).get('email')||'');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const resend=kind==='verify';
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage('');setError('');try{const r=await api<{message:string}>(resend?'/auth/resend-verification':'/auth/forgot-password',{method:'POST',body:JSON.stringify({email})});setMessage(r.message)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <Layout title={resend?'Reenviar confirmação':'Recuperar senha'} description={resend?'Não encontrou a mensagem? Solicite um novo link de validação.':'Enviaremos um link para criar uma nova senha, válido por 30 minutos.'}>
  {resend?<MailCheck size={38} className="pink"/>:<MailQuestion size={38} className="pink"/>}
  <form onSubmit={submit}><label>E-mail da sua conta<input type="email" required autoComplete="email" maxLength={254} placeholder="voce@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="btn" disabled={busy}>{busy?'Enviando...':resend?'Reenviar link':'Enviar recuperação'}</button></form>
  {message&&<p className="success-message" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
  <p className="muted">Confira também sua caixa de spam. Por segurança, não revelamos se um endereço está cadastrado.</p>
 </Layout>;
}
export function ResendEmail(){return <EmailRequest kind="verify"/>}
export function ForgotPassword(){return <EmailRequest kind="reset"/>}
export function ResetPassword(){
 const token=useOneTimeToken(),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();if(password!==confirmation){setError('As senhas não coincidem.');return}setBusy(true);setError('');try{const r=await api<{message:string}>('/auth/reset-password',{method:'POST',body:JSON.stringify({token,password})});setMessage(r.message)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <Layout title="Nova senha" description="Defina uma nova senha. Seus acessos anteriores serão encerrados.">
  {message?<><CheckCircle2 size={42} className="auth-success-icon"/><p role="status" className="success-message">{message}</p><Link className="btn" to="/login">Entrar com a nova senha</Link></>:!token?<><p className="error">Link ausente. Solicite uma nova recuperação.</p><Link className="btn outline" to="/esqueci-senha">Solicitar link</Link></>:<><KeyRound size={38} className="pink"/><form onSubmit={submit}><label>Nova senha<input type="password" required autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar nova senha<input type="password" required autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button className="btn" disabled={busy}>{busy?'Alterando...':'Salvar nova senha'}</button></form>{error&&<p className="error" role="alert">{error}</p>}</>}
 </Layout>;
}
