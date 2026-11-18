import{AlertCircle,LoaderCircle}from'lucide-react';
export function Loading({text='Carregando...'}:{text?:string}){return <div className="state"><LoaderCircle size={25} className="spin"/><p>{text}</p></div>}
export function ErrorState({message,retry}:{message:string;retry?:()=>void}){return <div className="state error-state"><AlertCircle size={25}/><p>{message}</p>{retry&&<button className="btn" onClick={retry}>Tentar novamente</button>}</div>}
export function EmptyState({title,subtitle}:{title:string;subtitle?:string}){return <div className="state"><p className="empty-star">✦</p><h3>{title}</h3><p>{subtitle||'Nenhum conteúdo por enquanto.'}</p></div>}
