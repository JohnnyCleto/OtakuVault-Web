import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Trophy,Star,TrendingUp,Medal,BookOpen,Film,LibraryBig} from 'lucide-react';
import {useCatalog} from '../hooks/useCatalog';
import type {Kind} from '../types/media';
import {title} from '../types/media';
import {Loading,ErrorState} from '../components/PageStates';
export default function Rankings(){
 const[kind,setKind]=useState<'ANIME'|'MANGA'|'NOVEL'>('ANIME');const[sort,setSort]=useState('SCORE_DESC');const[page,setPage]=useState(1);
 const {items,loading,error,hasMore}=useCatalog({type:(kind==='NOVEL'?'MANGA':kind) as Kind,format:kind==='NOVEL'?'NOVEL':undefined,excludeNovels:kind==='MANGA'?'true':undefined,sort,adult:'false',page});
 const kinds:[typeof kind,string,typeof Film][]=[['ANIME','Animes',Film],['MANGA','Mangás',BookOpen],['NOVEL','Light Novels',LibraryBig]];
 return <div className="page ranking-page"><div className="page-heading"><span className="eyebrow">EXPLORAR · CLASSIFICAÇÕES</span><h1><Trophy/> Rankings do OtakuVault</h1><p>Explore os títulos mais bem avaliados e populares do catálogo AniList.</p></div>
 <div className="rank-options"><nav className="catalog-tabs">{kinds.map(([id,label,Icon])=><button className={kind===id?'selected':''} key={id} onClick={()=>{setKind(id);setPage(1)}}><Icon size={17}/>{label}</button>)}</nav><select value={sort} aria-label="Ordenar ranking" onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="SCORE_DESC">Mais bem avaliados</option><option value="POPULARITY_DESC">Mais populares</option><option value="TRENDING_DESC">Em alta</option><option value="FAVOURITES_DESC">Mais favoritados</option></select></div>
 {error&&<ErrorState message={error}/>}
 <div className="ranking-list">{items.map((m,i)=><Link to={`/titulo/${m.id}?type=${m.type}`} className="ranking-row" key={m.type+'-'+m.id}><span className={'rank-pos '+(i<3?'rank-top':'')}>{i===0?<Medal/>:`#${i+1}`}</span><img src={m.coverImage?.large} alt=""/><div className="ranking-text"><strong>{title(m)}</strong><div className="ranking-chips">{m.genres?.slice(0,4).map(g=><span key={g}>{g}</span>)}</div></div><span className="rank-score"><Star fill="currentColor" size={15}/>{m.averageScore?(m.averageScore/10).toFixed(1):'—'}</span><span className="rank-format">{m.format==='NOVEL'?'Light Novel':m.format||'—'}<small>{m.seasonYear||''}</small></span><span className="rank-popularity"><TrendingUp size={15}/>{m.popularity?.toLocaleString('pt-BR')||'—'}</span></Link>)}</div>
 {loading&&<Loading text="Carregando ranking..."/>}{hasMore&&!loading&&page<5&&<button className="btn outline center" onClick={()=>setPage(p=>p+1)}>Ver mais posições</button>}
 </div>
}
