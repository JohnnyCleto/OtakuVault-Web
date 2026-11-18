import {createContext,useContext,useMemo,useState,type ReactNode}from'react';
import type{Preferences}from'../types/media';
import{useAuth}from'./AuthContext';
const defaults:Preferences={autoplay:true,novidadesDot:true,salvarHistorico:true,blurAdult:true};
const key='otakuvault_web_settings';
function read():Preferences{try{const o=JSON.parse(localStorage.getItem(key)||'{}');return {...defaults,...Object.fromEntries(Object.entries(o).filter(([k,v])=>k in defaults&&typeof v==='boolean'))}}catch{return defaults}}
type Context={settings:Preferences;setSetting:(key:keyof Preferences,value:boolean)=>Promise<void>};
const C=createContext<Context|null>(null);
export function SettingsProvider({children}:{children:ReactNode}){const{me,update}=useAuth();const[guest,setGuest]=useState<Preferences>(read);const settings=me?{...defaults,...me.preferences}:guest;const setSetting=async(k:keyof Preferences,value:boolean)=>{if(me)await update({preferences:{[k]:value}});else setGuest(old=>{const next={...old,[k]:value};localStorage.setItem(key,JSON.stringify(next));return next})};const v=useMemo(()=>({settings,setSetting}),[settings.autoplay,settings.blurAdult,settings.novidadesDot,settings.salvarHistorico,me]);return <C.Provider value={v}>{children}</C.Provider>}
export function useSettings(){const v=useContext(C);if(!v)throw Error('SettingsProvider ausente');return v}
