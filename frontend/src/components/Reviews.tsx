import {useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {MessageSquare,Star,Trash2,PenLine,AlertTriangle,Send} from 'lucide-react';
import {api} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import type {Media} from '../types/media';
import type {Review,ReviewsPage} from '../types/social';

export function ReviewCard({review,compact=false}:{review:Review;compact?:boolean}){
  const [reveal,setReveal]=useState(false);
  return <article className={'review-card '+(compact?'compact':'')}>
    <div className="review-top"><Link className="review-author" to={'/usuarios/'+review.author.id}>
      {review.author.avatar?<img src={review.author.avatar} alt=""/>:<span className="fallback-avatar">✦</span>}
      <span><b>{review.author.name}</b><small>{new Date(review.updatedAt).toLocaleDateString('pt-BR')}</small></span></Link>
      <strong className="review-score"><Star size={15} fill="currentColor"/>{(review.score/10).toFixed(1)} / 10</strong>
    </div>
    {compact&&<Link className="review-media" to={`/titulo/${review.mediaId}?type=${review.mediaType}`}>{review.mediaTitle||'Ver título'} {review.mediaFormat==='NOVEL'?'· Light Novel':''}</Link>}
    <h3>{review.title}</h3>
    {review.spoiler&&!reveal?<button className="spoiler-cover" onClick={()=>setReveal(true)}><AlertTriangle size={16}/> Esta review contém spoilers. Clique para revelar.</button>:<p className="review-body">{review.body}</p>}
    {review.spoiler&&reveal&&<button className="text-action" onClick={()=>setReveal(false)}>Ocultar spoilers</button>}
  </article>;
}

export default function Reviews({media}:{media:Media}){
  const {me}=useAuth();const nav=useNavigate();
  const [items,setItems]=useState<Review[]>([]),[page,setPage]=useState(1),[more,setMore]=useState(false);
  const [showForm,setShowForm]=useState(false),[headline,setHeadline]=useState(''),[body,setBody]=useState(''),[score,setScore]=useState(80),[spoiler,setSpoiler]=useState(false);
  const [error,setError]=useState(''),[saving,setSaving]=useState(false),[busy,setBusy]=useState(false);
  const mine=items.find(r=>r.userId===me?.id);
  async function load(p=1){setBusy(true);try{const r=await api<ReviewsPage>(`/reviews/media/${media.id}?type=${media.type}&page=${p}`);setItems(old=>p===1?r.items:[...old,...r.items.filter(n=>!old.some(x=>x.id===n.id))]);setMore(r.hasMore);setPage(p);setError('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  useEffect(()=>{setItems([]);void load(1)},[media.id,media.type]);
  const edit=()=>{if(!me){nav('/login');return}if(mine){setHeadline(mine.title);setBody(mine.body);setScore(mine.score);setSpoiler(mine.spoiler)}setShowForm(true)};
  async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError('');try{await api('/reviews',{method:'PUT',body:JSON.stringify({mediaId:media.id,mediaType:media.type,title:headline,body,score,spoiler})});setShowForm(false);await load(1)}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
  async function remove(){if(!confirm('Excluir sua review deste título?'))return;try{await api(`/reviews/${media.id}?type=${media.type}`,{method:'DELETE'});await load(1);setShowForm(false)}catch(e){setError((e as Error).message)}}
  return <section className="panel review-section"><div className="inline-heading"><div><h2><MessageSquare size={22}/> Reviews da comunidade</h2><p className="muted small-text">Avaliações próprias do OtakuVault. Uma review por usuário em cada título.</p></div><button className="btn" onClick={edit}><PenLine size={16}/>{mine?'Editar minha review':'Escrever review'}</button></div>
    {showForm&&<form className="review-form" onSubmit={submit}>
      <h3>{mine?'Editar avaliação':'Sua avaliação de '+(media.title.english||media.title.romaji)}</h3>
      <label>Título da review<input required minLength={3} maxLength={120} value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="O que você achou?"/></label>
      <label>Nota: <b>{(score/10).toFixed(1)} / 10</b><input className="review-range" type="range" min={1} max={100} step={1} value={score} onChange={e=>setScore(Number(e.target.value))}/></label>
      <label>Sua review <small>{body.length}/6000 (mínimo 30 caracteres)</small><textarea required minLength={30} maxLength={6000} rows={7} value={body} onChange={e=>setBody(e.target.value)} placeholder="Fale sobre a história, personagens, arte, trilha sonora e pontos positivos ou negativos..."/></label>
      <label className="inline-check"><input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)}/> Contém spoilers (texto será ocultado por padrão)</label>
      <div className="form-actions"><button disabled={saving} className="btn"><Send size={16}/>{saving?'Salvando...':'Publicar avaliação'}</button><button type="button" className="btn ghost" onClick={()=>setShowForm(false)}>Cancelar</button>{mine&&<button type="button" className="btn outline danger" onClick={()=>void remove()}><Trash2 size={15}/> Excluir</button>}</div>
    </form>}
    {error&&<p role="alert" className="error">{error}</p>}
    <div className="reviews-grid">{items.map(r=><ReviewCard key={r.id} review={r}/>)}</div>
    {!items.length&&!busy&&<p className="muted">Ainda não há reviews. Seja a primeira pessoa a avaliar este título!</p>}
    {more&&<button className="btn outline center" disabled={busy} onClick={()=>void load(page+1)}>Carregar mais reviews</button>}
  </section>;
}
