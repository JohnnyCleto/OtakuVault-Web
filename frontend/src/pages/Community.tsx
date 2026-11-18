import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Users,Search,MessageSquare,Activity,Heart,UserRound,BookOpen} from 'lucide-react';
import {api} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import {ReviewCard} from '../components/Reviews';
import type {Review,ReviewsPage,SocialUser,Activity as ActivityItem} from '../types/social';

export default function Community(){
 const {me}=useAuth();const [search,setSearch]=useState(''),[people,setPeople]=useState<SocialUser[]>([]),[reviews,setReviews]=useState<Review[]>([]),[feed,setFeed]=useState<ActivityItem[]>([]);
 const [tab,setTab]=useState<'people'|'reviews'|'feed'>('people'),[error,setError]=useState('');
 useEffect(()=>{let live=true;const timer=setTimeout(()=>{api<SocialUser[]>('/social/users?search='+encodeURIComponent(search)).then(data=>live&&setPeople(data)).catch(e=>live&&setError(e.message))},300);return()=>{live=false;clearTimeout(timer)}},[search]);
 useEffect(()=>{let live=true;if(tab==='reviews'){api<ReviewsPage>('/social/reviews').then(data=>live&&setReviews(data.items)).catch(e=>live&&setError(e.message))}if(tab==='feed'&&me){api<{items:ActivityItem[]}>('/feed').then(data=>live&&setFeed(data.items)).catch(e=>live&&setError(e.message))}return()=>{live=false}},[tab,me?.id]);
 return <div className="page community-page"><div className="community-hero"><span className="eyebrow">OTAKUVAULT SOCIAL</span><h1>Uma comunidade para compartilhar histórias<span className="pink">.</span></h1><p>Encontre pessoas, siga amigos, acompanhe o que estão lendo e escreva suas próprias reviews.</p><div className="community-hero-icons"><Users/><MessageSquare/><Heart/><BookOpen/></div></div>
 <nav className="social-tabs" aria-label="Seções da comunidade"><button className={tab==='people'?'active':''} onClick={()=>setTab('people')}><Users size={16}/> Pessoas</button><button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}><MessageSquare size={16}/> Reviews recentes</button><button className={tab==='feed'?'active':''} onClick={()=>setTab('feed')}><Activity size={16}/> Seguindo</button></nav>
 {error&&<p className="error">{error}</p>}
 {tab==='people'&&<><label className="search-field social-search"><Search size={18}/><input placeholder="Buscar por nome de usuário..." value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="social-people-grid">{people.map(p=><Link to={'/usuarios/'+p.id} key={p.id} className="person-tile">{p.avatar?<img src={p.avatar} alt=""/>:<span className="fallback-avatar"><UserRound/></span>}<span><strong>{p.name}</strong><small>{p.bio||'Ver perfil e biblioteca'}</small></span></Link>)}</div>{!people.length&&<p className="muted">Nenhum usuário encontrado.</p>}</>}
 {tab==='reviews'&&<div className="reviews-grid">{reviews.map(r=><ReviewCard key={r.id} review={r} compact/>)}</div>}
 {tab==='feed'&&(!me?<div className="panel empty-social"><Users size={35}/><h3>Seu feed começa com seus amigos</h3><p>Entre na sua conta para seguir pessoas e ver as atividades delas.</p><Link to="/login" className="btn">Entrar</Link></div>:feed.length?<div className="social-feed">{feed.map(f=><article className="feed-card" key={f.id}>{f.user&&<Link to={'/usuarios/'+f.user.id} className="review-author">{f.user.avatar?<img src={f.user.avatar} alt=""/>:<span className="fallback-avatar">✦</span>}<strong>{f.user.name}</strong></Link>}<p>{f.action==='REVIEW'?'Escreveu uma avaliação de':'Atualizou sua lista de'} <Link to={`/titulo/${f.mediaId}?type=${f.mediaType}`}>{f.mediaTitle}</Link></p><small>{new Date(f.createdAt).toLocaleString('pt-BR')}</small></article>)}</div>:<div className="panel empty-social"><Activity size={35}/><h3>Seu feed está vazio</h3><p>Siga pessoas na comunidade para ver novas reviews e atividades.</p><button className="btn" onClick={()=>setTab('people')}>Encontrar pessoas</button></div>)}
 </div>;
}
