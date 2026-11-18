import {useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {MessageSquare,Plus,MessagesSquare,Send,Trash2,ArrowLeft,Clock3,PenLine} from 'lucide-react';
import {api} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import type {SocialUser} from '../types/social';
import {Loading} from '../components/PageStates';

type Category='GERAL'|'ANIMES'|'MANGAS'|'NOVELS'|'RECOMENDACOES';
const categories:[Category,string][]=[['GERAL','Geral'],['ANIMES','Animes'],['MANGAS','Mangás'],['NOVELS','Light Novels'],['RECOMENDACOES','Recomendações']];
type Thread={id:number;title:string;body:string;category:Category;user_id:string;author:SocialUser;createdAt:string;updatedAt:string;replies?:number};
type Reply={id:number;user_id:string;author:SocialUser;body:string;createdAt:string};
function ForumAvatar({user}:{user:SocialUser}){return user.avatar?<img src={user.avatar} alt=""/>:<span className="fallback-avatar">✦</span>}
export default function Forum(){const {me}=useAuth();const nav=useNavigate();
 const[items,setItems]=useState<Thread[]>([]),[category,setCategory]=useState<Category|'ALL'>('ALL'),[page,setPage]=useState(1),[more,setMore]=useState(false),[create,setCreate]=useState(false);
 const[title,setTitle]=useState(''),[body,setBody]=useState(''),[topicCategory,setTopicCategory]=useState<Category>('GERAL'),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;setLoading(true);api<{items:Thread[];hasMore:boolean}>(`/forum?category=${category}&page=${page}`).then(r=>{if(live){setItems(old=>page===1?r.items:[...old,...r.items]);setMore(r.hasMore);setError('')}}).catch(e=>live&&setError(e.message)).finally(()=>live&&setLoading(false));return()=>{live=false}},[category,page]);
 async function submit(e:FormEvent){e.preventDefault();try{const r=await api<{id:number}>('/forum',{method:'POST',body:JSON.stringify({title,body,category:topicCategory})});nav('/forum/'+r.id)}catch(e){setError((e as Error).message)}}
 return <div className="page forum-page"><div className="page-heading"><span className="eyebrow">CONVERSAS DA COMUNIDADE</span><h1><MessagesSquare/> Fórum OtakuVault</h1><p>Compartilhe recomendações, teorias e opiniões sobre suas histórias favoritas. Respeite os outros participantes e evite spoilers sem aviso.</p></div>
 <div className="forum-toolbar"><select value={category} aria-label="Categoria" onChange={e=>{setCategory(e.target.value as Category|'ALL');setPage(1)}}><option value="ALL">Todas as categorias</option>{categories.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select><button className="btn" onClick={()=>{if(!me){nav('/login');return}setCreate(v=>!v)}}><Plus size={17}/> Novo tópico</button></div>
 {create&&<form className="panel form-stack forum-editor" onSubmit={submit}><h2>Criar tópico</h2><label>Assunto<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={140} minLength={5} required/></label><label>Categoria<select value={topicCategory} onChange={e=>setTopicCategory(e.target.value as Category)}>{categories.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label>Mensagem<textarea rows={6} value={body} onChange={e=>setBody(e.target.value)} required minLength={20} maxLength={8000}/></label><div className="form-actions"><button className="btn"><Send size={16}/> Publicar</button><button type="button" className="btn ghost" onClick={()=>setCreate(false)}>Cancelar</button></div></form>}
 {error&&<p className="error">{error}</p>}
 <div className="forum-list">{items.map(t=><Link className="forum-thread-row" to={'/forum/'+t.id} key={t.id}><ForumAvatar user={t.author}/><div><span className="forum-category">{categories.find(x=>x[0]===t.category)?.[1]||'Geral'}</span><strong>{t.title}</strong><small>por {t.author.name} · {new Date(t.updatedAt).toLocaleDateString('pt-BR')}</small></div><span className="forum-reply-count"><MessageSquare size={16}/> {Number(t.replies)||0}</span></Link>)}</div>
 {loading&&<Loading text="Carregando conversas..."/>}{!loading&&!items.length&&<p className="muted">Nenhum tópico nesta categoria.</p>}{more&&!loading&&<button className="btn center outline" onClick={()=>setPage(v=>v+1)}>Mais tópicos</button>}
 </div>
}
export function ForumThread(){const {id}=useParams();const {me}=useAuth();const nav=useNavigate();const [topic,setTopic]=useState<Thread|null>(null),[replies,setReplies]=useState<Reply[]>([]),[body,setBody]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[edit,setEdit]=useState(false),[editTitle,setEditTitle]=useState(''),[editBody,setEditBody]=useState('');
 async function reload(){try{const data=await api<{topic:Thread;replies:Reply[]}>(`/forum/${id}`);setTopic(data.topic);setReplies(data.replies);setEditTitle(data.topic.title);setEditBody(data.topic.body);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{void reload()},[id]);
 async function reply(e:FormEvent){e.preventDefault();setBusy(true);try{await api(`/forum/${id}/replies`,{method:'POST',body:JSON.stringify({body})});setBody('');await reload()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function removeTopic(){if(!confirm('Excluir este tópico e todas as suas respostas?'))return;try{await api('/forum/'+id,{method:'DELETE'});nav('/forum')}catch(e){setError((e as Error).message)}}
 async function updateTopic(e:FormEvent){e.preventDefault();try{await api('/forum/'+id,{method:'PUT',body:JSON.stringify({title:editTitle,body:editBody,category:topic?.category})});setEdit(false);await reload()}catch(e){setError((e as Error).message)}}
 async function deleteReply(replyId:number){if(!confirm('Excluir sua resposta?'))return;try{await api('/forum/replies/'+replyId,{method:'DELETE'});await reload()}catch(e){setError((e as Error).message)}}
 if(error&&!topic)return <div className="page"><p className="error">{error}</p><Link className="btn" to="/forum">Voltar</Link></div>;
 if(!topic)return <Loading text="Carregando tópico..."/>;
 return <div className="page forum-detail"><Link className="back-link" to="/forum"><ArrowLeft size={15}/> Voltar ao fórum</Link><div className="panel forum-post"><div className="inline-heading"><span className="forum-category">{categories.find(x=>x[0]===topic.category)?.[1]}</span>{me?.id===topic.user_id&&<div className="form-actions"><button className="btn ghost" onClick={()=>setEdit(!edit)}><PenLine size={16}/> Editar</button><button className="btn outline danger" onClick={()=>void removeTopic()}><Trash2 size={16}/> Excluir</button></div>}</div>
 <h1>{topic.title}</h1><Link className="review-author" to={'/usuarios/'+topic.author.id}><ForumAvatar user={topic.author}/><span><b>{topic.author.name}</b><small>{new Date(topic.createdAt).toLocaleString('pt-BR')}</small></span></Link>
 {edit?<form className="form-stack" onSubmit={updateTopic}><input required minLength={5} maxLength={140} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/><textarea required minLength={20} maxLength={8000} rows={6} value={editBody} onChange={e=>setEditBody(e.target.value)}/><button className="btn">Salvar edição</button></form>:<p className="forum-post-body">{topic.body}</p>}</div>
 <section className="forum-replies"><h2><MessageSquare/> Respostas ({replies.length})</h2>{replies.map(r=><article key={r.id} className="panel forum-reply"><div className="inline-heading"><Link className="review-author" to={'/usuarios/'+r.author.id}><ForumAvatar user={r.author}/><span><b>{r.author.name}</b><small>{new Date(r.createdAt).toLocaleString('pt-BR')}</small></span></Link>{me?.id===r.user_id&&<button className="icon-button" title="Excluir resposta" onClick={()=>void deleteReply(r.id)}><Trash2 size={17}/></button>}</div><p>{r.body}</p></article>)}</section>
 {error&&<p className="error">{error}</p>}{me?<form className="panel forum-reply-form" onSubmit={reply}><h3>Responder</h3><textarea required rows={5} minLength={2} maxLength={4000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Deixe sua opinião..."/><button disabled={busy} className="btn"><Send size={16}/> {busy?'Publicando...':'Publicar resposta'}</button></form>:<p className="panel">Entre na sua conta para participar. <Link to="/login">Fazer login</Link></p>}
 </div>
}
