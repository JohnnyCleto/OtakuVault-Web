import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode}from'react';
import {api}from'../services/api';
import {mediaSnap,type Entry,type Media,type Status}from'../types/media';
import{useAuth}from'./AuthContext';
type Patch=Partial<Pick<Entry,'status'|'progress'|'favorite'>>;
type Context={entries:Entry[];busy:boolean;refresh:()=>Promise<void>;find:(id:number)=>Entry|undefined;save:(media:Media,patch:Patch)=>Promise<void>;updateEntry:(entry:Entry,patch:Patch)=>Promise<void>;remove:(id:number)=>Promise<void>;clear:(mode:'all'|'favorites')=>Promise<void>};
const C=createContext<Context|null>(null);
export function LibraryProvider({children}:{children:ReactNode}){const{me}=useAuth();const[entries,setEntries]=useState<Entry[]>([]);const[busy,setBusy]=useState(false);
const refresh=useCallback(async()=>{if(!me){setEntries([]);return}try{setEntries(await api<Entry[]>('/library'))}catch{setEntries([])}},[me?.id,me?.adultEnabled]);
useEffect(()=>{void refresh()},[refresh]);
const find=(id:number)=>entries.find(e=>e.mediaId===id);
const updateEntry=async(entry:Entry,patch:Patch)=>{if(!me)throw Error('Entre na sua conta para salvar seus títulos');const next={...entry,...patch};setBusy(true);try{await api('/library',{method:'PUT',body:JSON.stringify(next)});if(patch.progress!==undefined&&patch.progress!==entry.progress){await api('/episodes',{method:'POST',body:JSON.stringify({mediaId:next.mediaId,episode:next.progress,kind:next.mediaType})})}await refresh()}finally{setBusy(false)}};
const save=async(media:Media,patch:Patch)=>{if(!me)throw Error('Entre na sua conta para salvar títulos');const old=find(media.id);await updateEntry({mediaId:media.id,mediaType:media.type,status:old?.status||'PLANNING',progress:old?.progress||0,favorite:!!old?.favorite,...mediaSnap(media),snapshot:mediaSnap(media)} as Entry,patch)};
const remove=async(id:number)=>{await api('/library/'+id,{method:'DELETE'});await refresh()};
const clear=async(mode:'all'|'favorites')=>{await api(mode==='all'?'/library':'/favorites',{method:'DELETE'});await refresh()};
const value=useMemo(()=>({entries,busy,refresh,find,save,updateEntry,remove,clear}),[entries,busy,refresh,me?.id]);return <C.Provider value={value}>{children}</C.Provider>}
export function useLibrary(){const v=useContext(C);if(!v)throw new Error('LibraryProvider ausente');return v}
export const STATUS_VALUES:Status[]=['PLANNING','CURRENT','COMPLETED','DROPPED','NOT_RECOMMENDED'];
