import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {api,ApiError} from '../services/api';
import type{Me}from '../types/media';
type Context={me:Me|null;ready:boolean;refresh:()=>Promise<void>;login:(email:string,password:string)=>Promise<void>;register:(name:string,email:string,password:string)=>Promise<{pendingVerification:boolean;email:string;message:string}>;update:(patch:Record<string,unknown>)=>Promise<void>;logout:()=>Promise<void>};
const C=createContext<Context|null>(null);
export function AuthProvider({children}:{children:ReactNode}){const[me,setMe]=useState<Me|null>(null);const[ready,setReady]=useState(false);
const refresh=useCallback(async()=>{try{setMe(await api<Me>('/me'))}catch(e){if(!(e instanceof ApiError)||e.status!==401)console.warn('Falha ao verificar sessão',e);setMe(null)}finally{setReady(true)}},[]);
useEffect(()=>{void refresh()},[refresh]);
const login=async(email:string,password:string)=>{setMe(await api<Me>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}))};
const register=async(name:string,email:string,password:string)=>api<{pendingVerification:boolean;email:string;message:string}>('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});
const update=async(patch:Record<string,unknown>)=>{setMe(await api<Me>('/me',{method:'PATCH',body:JSON.stringify(patch)}))};
const logout=async()=>{await api('/auth/logout',{method:'POST'});setMe(null)};
const value=useMemo(()=>({me,ready,refresh,login,register,update,logout}),[me,ready,refresh]);return <C.Provider value={value}>{children}</C.Provider>}
export function useAuth(){const v=useContext(C);if(!v)throw new Error('AuthProvider ausente');return v}
