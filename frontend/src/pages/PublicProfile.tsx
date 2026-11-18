import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {BookOpen,Heart,Users,PenLine,CalendarDays,UserPlus,UserMinus,Star,LibraryBig,Film,MessageSquare,Activity as ActivityIcon,Shield,Share2} from 'lucide-react';
import {api} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import {ReviewCard} from '../components/Reviews';
import {Loading,EmptyState} from '../components/PageStates';
import type {Activity,PublicData,PublicEntry,Review,ReviewsPage,SocialUser} from '../types/social';

type Tab='overview'|'anime'|'manga'|'novel'|'favorites'|'reviews'|'activity'|'followers'|'following'|'stats';
const tabs:[Tab,string][]=[['overview','Visão geral'],['anime','Animes'],['manga','Mangás'],['novel','Light Novels'],['favorites','Favoritos'],['stats','Estatísticas'],['reviews','Reviews'],['activity','Atividade'],['followers','Seguidores'],['following','Seguindo']];
const statLabel:{[k:string]:string}={animes:'Animes',mangas:'Mangás',novels:'Light Novels',favorites:'Favoritos',current:'Em andamento',completed:'Concluídos',reviews:'Reviews'};
function PeopleList({people}:{people:SocialUser[]}){return people.length?<div className="social-people-grid">{people.map(p=><Link className="person-tile" key={p.id} to={'/usuarios/'+p.id}>{p.avatar?<img src={p.avatar} alt=""/>:<span className="fallback-avatar">✦</span>}<span><strong>{p.name}</strong><small>{p.bio||'Ver perfil público'}</small></span></Link>)}</div>:<p className="muted">Nenhuma pessoa nesta lista.</p>}
function LibraryShowcase({items}:{items:PublicEntry[]}){return items.length?<div className="public-library-grid">{items.map(e=><Link to={`/titulo/${e.mediaId}?type=${e.mediaType}`} key={e.mediaType+'-'+e.mediaId} className="public-library-item">{e.cover?<img src={e.cover} alt=""/>:<span>✦</span>}<strong>{e.title}</strong><small>{e.status} · {e.progress}{e.mediaType==='ANIME'?' eps.':e.mediaFormat==='NOVEL'?' caps.':' caps.'}</small></Link>)}</div>:<p className="muted">Não há títulos para mostrar nesta aba.</p>}
function ActivityList({items}:{items:Activity[]}){return items.length?<div className="activity-list">{items.map(a=><div className="activity-row" key={a.id}>{a.mediaCover?<img src={a.mediaCover} alt=""/>:<span>✦</span>}<div><p><strong>{a.action==='REVIEW'?'Publicou uma review':'Atualizou a biblioteca'}</strong> de <Link to={`/titulo/${a.mediaId}?type=${a.mediaType}`}>{a.mediaTitle}</Link></p><small>{new Date(a.createdAt).toLocaleString('pt-BR')}</small></div></div>)}</div>:<p className="muted">Nenhuma atividade pública registrada.</p>}
export default function PublicProfile({self=false}:{self?:boolean}){
 const params=useParams();const {me}=useAuth();const nav=useNavigate();const id=self?me?.id:params.id;
 const [profile,setProfile]=useState<PublicData|null>(null),[tab,setTab]=useState<Tab>('overview');
 const [library,setLibrary]=useState<PublicEntry[]>([]),[reviews,setReviews]=useState<Review[]>([]),[activity,setActivity]=useState<Activity[]>([]),[people,setPeople]=useState<SocialUser[]>([]);
 const [loading,setLoading]=useState(true),[paneLoading,setPaneLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setTab('overview');setProfile(null);setError('');if(!id){setLoading(false);return}let live=true;setLoading(true);api<PublicData>('/users/'+id).then(data=>{if(live)setProfile(data)}).catch(e=>live&&setError(e.message)).finally(()=>live&&setLoading(false));return()=>{live=false}},[id]);
 useEffect(()=>{if(!profile||!id)return;let live=true;setPaneLoading(true);const paths:Record<string,string>={followers:`/users/${id}/followers`,following:`/users/${id}/following`,reviews:`/users/${id}/reviews`,activity:`/users/${id}/activity`};
  const key=(tab==='overview'||['anime','manga','novel','favorites','stats'].includes(tab))?'library':tab;
  const path=key==='library'?`/users/${id}/library`:paths[key];
  if(!path){setPaneLoading(false);return}
  api<PublicEntry[]|ReviewsPage|{items:Activity[]}|SocialUser[]>(path).then(data=>{if(!live)return;if(key==='library')setLibrary(data as PublicEntry[]);if(key==='reviews')setReviews((data as ReviewsPage).items);if(key==='activity')setActivity((data as {items:Activity[]}).items);if(key==='followers'||key==='following')setPeople(data as SocialUser[])}).catch(e=>{if(live)setNotice(e.message)}).finally(()=>{if(live)setPaneLoading(false)});return()=>{live=false}
 },[id,tab,profile?.user.id]);
 async function follow(){if(!me){nav('/login');return}if(!id)return;try{const next=!profile?.isFollowing;await api('/users/'+id+'/follow',{method:next?'POST':'DELETE'});setProfile(p=>p?{...p,isFollowing:next,counts:{...p.counts,followers:Math.max(0,Number(p.counts.followers)+(next?1:-1))}}:p)}catch(e){setNotice((e as Error).message)}}
 if(!id)return <div className="page restricted"><h1>Entre para acessar seu perfil</h1><Link className="btn" to="/login">Entrar</Link></div>;
 if(loading)return <Loading text="Carregando perfil da comunidade..."/>;
 if(error||!profile)return <div className="page restricted"><Shield size={40}/><h1>Perfil indisponível</h1><p>{error||'Usuário não encontrado.'}</p><Link className="btn" to="/comunidade">Explorar comunidade</Link></div>;
 const {user,counts}=profile;
 const display=tab==='overview'?library.slice(0,12):library.filter(e=>tab==='favorites'?Boolean(e.favorite):tab==='anime'?e.mediaType==='ANIME':tab==='novel'?e.mediaFormat==='NOVEL':tab==='manga'?e.mediaType==='MANGA'&&e.mediaFormat!=='NOVEL':true);
 return <div className="page social-profile"><div className="social-profile-banner"><div className="profile-cover-art"/><div className="social-identity">{user.avatar?<img src={user.avatar} className="social-avatar" alt=""/>:<span className="social-avatar placeholder">✦</span>}<div><span className="eyebrow">PERFIL · OTAKUVAULT</span><h1>{user.name}</h1>{user.bio&&<p>{user.bio}</p>}<small><CalendarDays size={13}/> Membro desde {user.createdAt?new Date(user.createdAt).toLocaleDateString('pt-BR'):'—'}</small></div><div className="social-profile-actions">{profile.isOwn?<Link to="/editar-perfil" className="btn outline"><PenLine size={16}/> Editar perfil</Link>:<button className={'btn '+(profile.isFollowing?'outline':'')} onClick={()=>void follow()}>{profile.isFollowing?<UserMinus size={17}/>:<UserPlus size={17}/>} {profile.isFollowing?'Seguindo':'Seguir'}</button>}<button title="Copiar link" className="btn ghost" onClick={()=>navigator.clipboard.writeText(window.location.href).then(()=>setNotice('Link do perfil copiado.')).catch(()=>setNotice('Não foi possível copiar.'))}><Share2 size={16}/></button></div></div></div>
  <div className="profile-counts"><div><strong>{Number(counts.animes)||0}</strong><span>Animes</span></div><div><strong>{Number(counts.mangas)||0}</strong><span>Mangás</span></div><div><strong>{Number(counts.novels)||0}</strong><span>Light Novels</span></div><div><strong>{Number(counts.reviews)||0}</strong><span>Reviews</span></div><button onClick={()=>setTab('followers')}><strong>{Number(counts.followers)||0}</strong><span>Seguidores</span></button><button onClick={()=>setTab('following')}><strong>{Number(counts.following)||0}</strong><span>Seguindo</span></button></div>
  <nav className="social-tabs" aria-label="Abas do perfil">{tabs.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>{setNotice('');setTab(key)}}>{label}</button>)}</nav>
  {notice&&<p className="error" role="status" onClick={()=>setNotice('')}>{notice} ×</p>}
  {paneLoading&&<Loading text="Atualizando seção..."/>}
  <section className="social-pane">
   {['overview','anime','manga','novel','favorites'].includes(tab)&&<><h2><BookOpen size={20}/> {tab==='overview'?'Biblioteca recente':tabs.find(x=>x[0]===tab)?.[1]}</h2>{profile.showLibrary?<LibraryShowcase items={display}/>:<p className="muted">Esta pessoa não compartilha a biblioteca publicamente.</p>}</>}
   {tab==='stats'&&<><h2><Star/> Estatísticas pessoais</h2><div className="profile-stat-chart">{Object.entries(statLabel).map(([k,label])=><div className="profile-stat-row" key={k}><span>{label}</span><div><span style={{width:`${Math.max(1,Math.min(100,(Number(counts[k as keyof typeof counts])||0)/Math.max(1,Number(counts.total))*100))}%`}}/></div><strong>{Number(counts[k as keyof typeof counts])||0}</strong></div>)}</div><p className="muted small-text">Estatísticas locais do OtakuVault, apenas títulos não adultos.</p></>}
   {tab==='reviews'&&<><h2><MessageSquare/> Reviews de {user.name}</h2><div className="reviews-grid">{reviews.map(r=><ReviewCard key={r.id} review={r} compact/>)}</div>{!reviews.length&&<p className="muted">Nenhuma review pública ainda.</p>}</>}
   {tab==='activity'&&<><h2><ActivityIcon/> Atividade</h2>{profile.showActivity?<ActivityList items={activity}/>:<p className="muted">Atividade privada.</p>}</>}
   {['followers','following'].includes(tab)&&<><h2><Users/> {tab==='followers'?'Seguidores':'Seguindo'}</h2><PeopleList people={people}/></>}
  </section>
 </div>;
}
