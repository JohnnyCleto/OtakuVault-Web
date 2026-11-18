export type Kind='ANIME'|'MANGA';
export type Status='PLANNING'|'CURRENT'|'COMPLETED'|'DROPPED'|'NOT_RECOMMENDED';
export type Media={id:number;type:Kind;isAdult:boolean;title:{romaji:string;english?:string;native?:string};coverImage:{large:string;extraLarge?:string};bannerImage?:string;averageScore?:number;seasonYear?:number;episodes?:number;chapters?:number;duration?:number;genres?:string[];description?:string;siteUrl?:string;status?:string;format?:string;season?:string;volumes?:number;startDate?:{year?:number;month?:number;day?:number};endDate?:{year?:number;month?:number;day?:number};tags?:{name:string;rank:number;isMediaSpoiler:boolean}[];rankings?:{rank:number;type:string;season?:string;year?:number;allTime?:boolean;context?:string}[];stats?:{scoreDistribution:{score:number;amount:number}[];statusDistribution:{status:string;amount:number}[]};trends?:{nodes:{date:number;trending:number;popularity?:number}[]};popularity?:number;favourites?:number;trailer?:{id:string;site:string;thumbnail?:string};externalLinks?:{site:string;url:string;type:string;isDisabled:boolean;language?:string}[];studios?:{nodes:{name:string}[]};staff?:{nodes:{name:{full:string}}[]};characters?:{edges:{role:string;node:{id:number;name:{full:string};image:{large:string}}}[]}};
export type Entry={mediaId:number;mediaType:Kind;status:Status;progress:number;favorite:boolean|number;updatedAt?:string;title?:string;cover?:string;isAdult?:boolean|number;total?:number|null;mediaFormat?:string};
export type Preferences={autoplay:boolean;novidadesDot:boolean;salvarHistorico:boolean;blurAdult:boolean};
export type Me={id:string;name:string;email:string;emailVerified:boolean;avatar:string;bio:string;adultEnabled:boolean;profilePublic:boolean;showLibrary:boolean;showActivity:boolean;preferences:Preferences;createdAt?:string};
export type HistoryEntry={id:number;mediaId:number;viewedAt:string;title?:string;cover?:string;isAdult?:boolean};
export type Airing={id:number;episode:number;airingAt:number;media:{id:number;title:{romaji:string;english?:string};coverImage:{large:string}}};
export const title=(m:Media)=>m.title?.english||m.title?.romaji||'Título sem nome';
export const mediaCache=new Map<number,Media>();
export const statusOptions:{value:Status;label:string;short:string}[]=[
{value:'PLANNING',label:'Planejo acompanhar',short:'Planejando'},
{value:'CURRENT',label:'Acompanhando',short:'Em andamento'},
{value:'COMPLETED',label:'Completo',short:'Completo'},
{value:'DROPPED',label:'Abandonei',short:'Dropado'},
{value:'NOT_RECOMMENDED',label:'Não recomendo',short:'Não recomendo'}
];
export const labelStatus=(s:Status)=>statusOptions.find(o=>o.value===s)?.short||s;
export const stripMarkup=(text?:string)=> (text||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export const mediaSnap=(m:Media)=>({title:title(m),cover:m.coverImage?.large||'',isAdult:!!m.isAdult,format:m.format||'',total:m.type==='ANIME'?m.episodes:m.chapters});
export const genreLabels:Record<string,string>={Action:'Ação',Adventure:'Aventura',Comedy:'Comédia',Drama:'Drama',Fantasy:'Fantasia',Romance:'Romance','Slice of Life':'Cotidiano',Supernatural:'Sobrenatural','Sci-Fi':'Ficção científica',Mystery:'Mistério',Sports:'Esportes',Horror:'Terror',Music:'Música',Psychological:'Psicológico',Thriller:'Suspense',Mecha:'Mecha'};
export const genres=Object.entries(genreLabels);
