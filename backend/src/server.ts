import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {z} from 'zod';
import type {RowDataPacket} from 'mysql2/promise';
import {randomBytes, createHash} from 'node:crypto';
import {sendAccountEmail, verifyMailConnection, type EmailPurpose} from './mailer.js';

declare global { namespace Express { interface Request {userId?:string} } }
const app=express();
app.disable('x-powered-by'); app.use(helmet()); app.use(express.json({limit:'64kb'})); app.use(cookieParser());
const secret=process.env.JWT_SECRET;
if(!secret || secret.length<32) throw new Error('JWT_SECRET deve ter ao menos 32 caracteres.');
const mongo=process.env.MONGO_URL || 'mongodb://localhost:27017/otakuvault';
const pool=mysql.createPool({host:process.env.MYSQL_HOST||'localhost',user:process.env.MYSQL_USER||'otaku',password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE||'otakuvault',waitForConnections:true,connectionLimit:10,decimalNumbers:true});
const defaults={autoplay:true,novidadesDot:true,salvarHistorico:true,blurAdult:true};
const schema=new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:80},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true},
 passwordHash:{type:String,required:true},
 emailVerified:{type:Boolean,default:false},emailVerifiedAt:{type:Date,default:null},
 sessionVersion:{type:Number,default:0},
 avatar:{type:String,default:''}, bio:{type:String,default:'',maxlength:160},
 profilePublic:{type:Boolean,default:true},showLibrary:{type:Boolean,default:true},showActivity:{type:Boolean,default:true},
 adultEnabled:{type:Boolean,default:false}, adultConfirmedAt:{type:Date,default:null},
 preferences:{autoplay:{type:Boolean,default:true},novidadesDot:{type:Boolean,default:true},salvarHistorico:{type:Boolean,default:true},blurAdult:{type:Boolean,default:true}}
},{timestamps:true});
const User=mongoose.model('User',schema);
// Apenas hash SHA-256 dos tokens é persistido. TTL remove tokens expirados.
const authTokenSchema=new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,required:true,index:true,ref:'User'},
 purpose:{type:String,required:true,enum:['verify','reset']},
 tokenHash:{type:String,required:true,unique:true},
 expiresAt:{type:Date,required:true},
 createdAt:{type:Date,default:Date.now}
});
authTokenSchema.index({expiresAt:1},{expireAfterSeconds:0});
const AuthToken=mongoose.model('AuthToken',authTokenSchema);
const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
const tokenInput=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)});
const emailInput=z.object({email:z.string().trim().toLowerCase().email().max(254)});
const resendLimit=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false});
async function issueEmailToken(user:any,purpose:EmailPurpose){
  // Evita múltiplos e-mails para uma mesma conta em curto intervalo.
  const previous=await AuthToken.findOne({userId:user._id,purpose}).sort({createdAt:-1});
  if(previous&&Date.now()-new Date(previous.createdAt).getTime()<60_000)return false;
  const raw=randomBytes(32).toString('hex');
  await AuthToken.deleteMany({userId:user._id,purpose});
  const document=await AuthToken.create({userId:user._id,purpose,tokenHash:hashToken(raw),expiresAt:new Date(Date.now()+(purpose==='verify'?24*60:30)*60_000)});
  try{await sendAccountEmail(user.email,user.name,purpose,raw);return true}
  catch(error){await document.deleteOne();throw error}
}

const wrap=(handler:(req:Request,res:Response)=>Promise<unknown>|unknown)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve().then(()=>handler(req,res)).catch(next);
// Em toda requisição protegida, valida a versão da sessão. Uma redefinição
// de senha invalida imediatamente todos os cookies antigos.
async function verify(req:Request):Promise<string|null>{
 try{
  const token=req.cookies?.session;
  if(typeof token!=='string')return null;
  const data=jwt.verify(token,secret!) as jwt.JwtPayload;
  if(typeof data.sub!=='string'||!mongoose.isValidObjectId(data.sub)||typeof data.v!=='number')return null;
  const user=await User.findById(data.sub).select('emailVerified sessionVersion');
  return user?.emailVerified===true&&Number(user.sessionVersion||0)===data.v?data.sub:null;
 }catch{return null}
}
function auth(req:Request,res:Response,next:NextFunction){
 void verify(req).then(id=>{if(!id){res.status(401).json({error:'Entre na sua conta'});return}req.userId=id;next()}).catch(next);
}
function uid(req:Request):string {if(!req.userId)throw new Error('ID de sessão ausente');return req.userId}
const authLimit=rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false});
function cookie(res:Response,id:string,version:number){res.cookie('session',jwt.sign({sub:id,v:version},secret!,{expiresIn:'7d'}),{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:604800000,path:'/'});}
const publicUser=(u:any)=>({id:String(u.id),name:u.name,email:u.email,emailVerified:u.emailVerified===true,avatar:u.avatar||'',bio:u.bio||'',adultEnabled:Boolean(u.adultEnabled),profilePublic:u.profilePublic!==false,showLibrary:u.showLibrary!==false,showActivity:u.showActivity!==false,preferences:{...defaults,...(typeof u.preferences?.toObject==='function'?u.preferences.toObject():u.preferences)},createdAt:u.createdAt});
const credentials=z.object({email:z.string().email().max(254).transform(x=>x.trim().toLowerCase()),password:z.string().min(8).max(128)});
// Cadastro pendente: nenhuma sessão é emitida até o dono do e-mail confirmar o link.
app.post('/api/auth/register',authLimit,wrap(async(req,res)=>{
 const d=credentials.extend({name:z.string().trim().min(2).max(80)}).safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Informe nome, e-mail válido e senha com 8+ caracteres'});
 if(await User.exists({email:d.data.email}))return res.status(409).json({error:'E-mail já cadastrado. Se ainda não ativou a conta, solicite outro link.'});
 let u;
 try{u=await User.create({name:d.data.name,email:d.data.email,passwordHash:await argon2.hash(d.data.password),emailVerified:false})}
 catch(e:any){if(e.code===11000)return res.status(409).json({error:'E-mail já cadastrado'});throw e}
 try{await issueEmailToken(u,'verify')}
 catch(e){console.error('[SMTP] Falha ao enviar verificação:',e);return res.status(503).json({error:'Conta criada, mas o e-mail não pôde ser enviado. Use Reenviar confirmação quando o servidor de e-mail estiver disponível.'})}
 return res.status(201).json({pendingVerification:true,email:u.email,message:'Cadastro iniciado. Abra seu e-mail e clique no link de confirmação antes de entrar.'});
}));
app.post('/api/auth/login',authLimit,wrap(async(req,res)=>{
 const d=credentials.safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Dados inválidos'});
 const u=await User.findOne({email:d.data.email});
 if(!u||!(await argon2.verify(u.passwordHash,d.data.password)))return res.status(401).json({error:'Credenciais inválidas'});
 if(u.emailVerified!==true)return res.status(403).json({code:'EMAIL_NOT_VERIFIED',error:'E-mail ainda não confirmado. Verifique sua caixa de entrada ou solicite outro link.'});
 cookie(res,String(u.id),Number(u.sessionVersion||0));return res.json(publicUser(u));
}));
app.post('/api/auth/resend-verification',resendLimit,wrap(async(req,res)=>{
 const d=emailInput.safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Informe um e-mail válido'});
 // Resposta genérica impede identificar contas válidas por este endpoint.
 const message='Se houver uma conta pendente com esse e-mail, enviaremos um novo link. Confira também o spam.';
 const u=await User.findOne({email:d.data.email,emailVerified:{$ne:true}});
 if(u){try{await issueEmailToken(u,'verify')}catch(e){console.error('[SMTP] Falha no reenvio:',e)}}
 return res.json({message});
}));
app.post('/api/auth/verify-email',resendLimit,wrap(async(req,res)=>{
 const d=tokenInput.safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Link de verificação inválido'});
 const t=await AuthToken.findOneAndDelete({tokenHash:hashToken(d.data.token),purpose:'verify',expiresAt:{$gt:new Date()}});
 if(!t)return res.status(400).json({error:'Link inválido, expirado ou já utilizado. Solicite um novo link.'});
 const u=await User.findById(t.userId);
 if(!u)return res.status(400).json({error:'Conta não encontrada'});
 u.emailVerified=true;u.emailVerifiedAt=new Date();await u.save();
 await AuthToken.deleteMany({userId:u._id,purpose:'verify'});
 return res.json({ok:true,message:'E-mail confirmado! Agora você pode entrar no OtakuVault.'});
}));
app.post('/api/auth/forgot-password',resendLimit,wrap(async(req,res)=>{
 const d=emailInput.safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Informe um e-mail válido'});
 const message='Se esse e-mail estiver associado a uma conta, enviaremos as instruções de recuperação.';
 const u=await User.findOne({email:d.data.email});
 if(u){try{await issueEmailToken(u,'reset')}catch(e){console.error('[SMTP] Falha na recuperação:',e)}}
 return res.json({message});
}));
app.post('/api/auth/reset-password',resendLimit,wrap(async(req,res)=>{
 const d=tokenInput.extend({password:z.string().min(8).max(128)}).safeParse(req.body);
 if(!d.success)return res.status(400).json({error:'Link inválido ou senha com menos de 8 caracteres'});
 const t=await AuthToken.findOneAndDelete({tokenHash:hashToken(d.data.token),purpose:'reset',expiresAt:{$gt:new Date()}});
 if(!t)return res.status(400).json({error:'Link inválido, expirado ou já utilizado. Solicite outro link.'});
 const u=await User.findById(t.userId);
 if(!u)return res.status(400).json({error:'Conta não encontrada'});
 u.passwordHash=await argon2.hash(d.data.password);
 u.sessionVersion=Number(u.sessionVersion||0)+1;
 await u.save();await AuthToken.deleteMany({userId:u._id,purpose:'reset'});
 return res.json({ok:true,message:'Senha atualizada. Entre novamente com sua nova senha.'});
}));
app.post('/api/auth/logout',(_req,res)=>{res.clearCookie('session',{sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',path:'/'});res.json({ok:true})});
app.get('/api/me',auth,wrap(async(req,res)=>{const u=await User.findById(uid(req));return u?res.json(publicUser(u)):res.status(401).json({error:'Conta não encontrada'})}));
app.patch('/api/me',auth,wrap(async(req,res)=>{const d=z.object({name:z.string().trim().min(2).max(80).optional(),bio:z.string().max(160).optional(),avatar:z.union([z.string().url().max(1000),z.literal('')]).optional(),adultEnabled:z.boolean().optional(),adultConfirmed:z.literal(true).optional(),profilePublic:z.boolean().optional(),showLibrary:z.boolean().optional(),showActivity:z.boolean().optional(),preferences:z.object({autoplay:z.boolean().optional(),novidadesDot:z.boolean().optional(),salvarHistorico:z.boolean().optional(),blurAdult:z.boolean().optional()}).strict().optional()}).strict().safeParse(req.body);if(!d.success)return res.status(400).json({error:'Dados inválidos'});if(d.data.adultEnabled===true&&d.data.adultConfirmed!==true){return res.status(400).json({error:'Confirme ser maior de idade para ativar a área restrita'})}const u=await User.findById(uid(req));if(!u)return res.status(404).json({error:'Conta não encontrada'});for(const k of ['name','bio','avatar','profilePublic','showLibrary','showActivity'] as const){const v=d.data[k];if(v!==undefined)u.set(k,v)}if(d.data.adultEnabled!==undefined){u.adultEnabled=d.data.adultEnabled;if(d.data.adultEnabled)u.adultConfirmedAt=new Date()}if(d.data.preferences){for(const [k,v] of Object.entries(d.data.preferences))if(v!==undefined)u.set(`preferences.${k}`,v)}await u.save();return res.json(publicUser(u))}));
app.delete('/api/me',auth,wrap(async(req,res)=>{const d=z.object({password:z.string().min(1)}).safeParse(req.body);if(!d.success)return res.status(400).json({error:'Confirme a senha para excluir a conta'});const u=await User.findById(uid(req));if(!u||!(await argon2.verify(u.passwordHash,d.data.password)))return res.status(403).json({error:'Senha incorreta'});const id=uid(req);await pool.execute('DELETE FROM history_entries WHERE user_id=?',[id]);await pool.execute('DELETE FROM episode_events WHERE user_id=?',[id]);await pool.execute('DELETE FROM user_media_snapshots WHERE user_id=?',[id]);await pool.execute('DELETE FROM library_entries WHERE user_id=?',[id]);await pool.execute('DELETE FROM reviews WHERE user_id=?',[id]);await pool.execute('DELETE FROM follows WHERE follower_id=? OR followed_id=?',[id,id]);await pool.execute('DELETE FROM activity_events WHERE user_id=?',[id]);await pool.execute('DELETE FROM forum_replies WHERE user_id=? OR thread_id IN (SELECT id FROM forum_threads WHERE user_id=?)',[id,id]);await pool.execute('DELETE FROM forum_threads WHERE user_id=?',[id]);await AuthToken.deleteMany({userId:u._id});await u.deleteOne();res.clearCookie('session',{sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',path:'/'});return res.json({ok:true})}));
// Biblioteca MySQL + metadados resumidos para não exibir somente "Título #ID" após recarregar.
const entry=z.object({mediaId:z.number().int().positive(),mediaType:z.enum(['ANIME','MANGA']),status:z.enum(['PLANNING','CURRENT','COMPLETED','DROPPED','NOT_RECOMMENDED']).default('PLANNING'),progress:z.number().int().min(0).max(100000).default(0),favorite:z.boolean().default(false),snapshot:z.object({title:z.string().max(300),cover:z.string().url().max(1200).optional(),isAdult:z.boolean().optional(),total:z.number().int().min(0).max(100000).optional(),format:z.string().max(30).optional()}).optional()});
app.get('/api/library',auth,wrap(async(req,res)=>{const [rows]=await pool.execute(`SELECT l.media_id AS mediaId,l.media_type AS mediaType,l.status,l.progress,l.favorite,l.updated_at AS updatedAt,s.title,s.cover,s.is_adult AS isAdult,s.total,s.media_format AS mediaFormat FROM library_entries l LEFT JOIN user_media_snapshots s ON s.media_id=l.media_id AND s.user_id=l.user_id WHERE l.user_id=? AND (?=1 OR s.is_adult IS NULL OR s.is_adult=0) ORDER BY l.updated_at DESC`,[uid(req),await adultAllowed(req)?1:0]);return res.json(rows)}));
app.put('/api/library',auth,wrap(async(req,res)=>{
 const parsed=entry.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Dados da biblioteca inválidos'});
 const d=parsed.data;let facts:Awaited<ReturnType<typeof mediaFacts>>|null=null;
 if(d.snapshot){facts=await mediaFacts(d.mediaId,d.mediaType);if(facts.isAdult&&!(await adultAllowed(req)))return res.status(403).json({error:'Conteúdo restrito'});}
 const [before]=await pool.execute<RowDataPacket[]>('SELECT status,progress FROM library_entries WHERE user_id=? AND media_id=?',[uid(req),d.mediaId]);
 await pool.execute(`INSERT INTO library_entries (user_id,media_id,media_type,status,progress,favorite) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE media_type=VALUES(media_type),status=VALUES(status),progress=VALUES(progress),favorite=VALUES(favorite)`,[uid(req),d.mediaId,d.mediaType,d.status,d.progress,d.favorite]);
 if(facts){const name=facts.title?.english||facts.title?.romaji||d.snapshot!.title;
  await pool.execute(`INSERT INTO user_media_snapshots (user_id,media_id,title,cover,is_adult,total,media_format) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),cover=VALUES(cover),is_adult=VALUES(is_adult),total=VALUES(total),media_format=VALUES(media_format)`,[uid(req),d.mediaId,name,facts.coverImage?.large||'',facts.isAdult?1:0,d.snapshot?.total??null,facts.format||'']);
  if(!facts.isAdult&&(!before.length||before[0].status!==d.status))await pool.execute(`INSERT INTO activity_events (user_id,action,media_id,media_type,media_title,media_cover,is_adult) VALUES (?,'LIBRARY',?,?,?,?,0)`,[uid(req),d.mediaId,d.mediaType,name,facts.coverImage?.large||'']);
 }
 return res.json({ok:true});
}));
app.delete('/api/library/:id',auth,wrap(async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)return res.status(400).json({error:'ID inválido'});await pool.execute('DELETE FROM library_entries WHERE user_id=? AND media_id=?',[uid(req),id]);return res.json({ok:true})}));
app.delete('/api/library',auth,wrap(async(req,res)=>{await pool.execute('DELETE FROM library_entries WHERE user_id=?',[uid(req)]);return res.json({ok:true})}));
app.delete('/api/favorites',auth,wrap(async(req,res)=>{await pool.execute('UPDATE library_entries SET favorite=FALSE WHERE user_id=?',[uid(req)]);return res.json({ok:true})}));
app.get('/api/history',auth,wrap(async(req,res)=>{const [rows]=await pool.execute(`SELECT h.id,h.media_id AS mediaId,h.viewed_at AS viewedAt,s.title,s.cover,s.is_adult AS isAdult FROM history_entries h LEFT JOIN user_media_snapshots s ON s.media_id=h.media_id AND s.user_id=h.user_id WHERE h.user_id=? AND (?=1 OR s.is_adult IS NULL OR s.is_adult=0) ORDER BY h.viewed_at DESC LIMIT 50`,[uid(req),await adultAllowed(req)?1:0]);return res.json(rows)}));
app.post('/api/history',auth,wrap(async(req,res)=>{const d=z.object({mediaId:z.number().int().positive(),snapshot:z.object({title:z.string().max(300),cover:z.string().url().max(1200).optional(),isAdult:z.boolean().optional(),total:z.number().int().min(0).max(100000).optional(),format:z.string().max(30).optional()}).optional()}).safeParse(req.body);if(!d.success)return res.status(400).json({error:'ID inválido'});const account=await User.findById(uid(req)).select('preferences.salvarHistorico');if(account?.preferences?.salvarHistorico===false)return res.json({ok:true,skipped:true});if(d.data.snapshot){const s=d.data.snapshot;await pool.execute('INSERT INTO user_media_snapshots (user_id,media_id,title,cover,is_adult,total,media_format) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),cover=VALUES(cover),is_adult=VALUES(is_adult),total=VALUES(total),media_format=VALUES(media_format)',[uid(req),d.data.mediaId,s.title,s.cover||'',Boolean(s.isAdult),s.total??null,s.format||''])}await pool.execute('DELETE FROM history_entries WHERE user_id=? AND media_id=?',[uid(req),d.data.mediaId]);await pool.execute('INSERT INTO history_entries (user_id,media_id) VALUES (?,?)',[uid(req),d.data.mediaId]);return res.status(201).json({ok:true})}));
app.delete('/api/history/:id',auth,wrap(async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)return res.status(400).json({error:'ID inválido'});await pool.execute('DELETE FROM history_entries WHERE user_id=? AND media_id=?',[uid(req),id]);return res.json({ok:true})}));
app.delete('/api/history',auth,wrap(async(req,res)=>{await pool.execute('DELETE FROM history_entries WHERE user_id=?',[uid(req)]);return res.json({ok:true})}));
app.post('/api/episodes',auth,wrap(async(req,res)=>{const d=z.object({mediaId:z.number().int().positive(),episode:z.number().int().min(0).max(100000),kind:z.enum(['ANIME','MANGA'])}).safeParse(req.body);if(!d.success)return res.status(400).json({error:'Progresso inválido'});const x=d.data;await pool.execute('INSERT INTO episode_events (user_id,media_id,episode,kind) VALUES (?,?,?,?)',[uid(req),x.mediaId,x.episode,x.kind]);return res.status(201).json({ok:true})}));
app.get('/api/episodes/:id',auth,wrap(async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)return res.status(400).json({error:'ID inválido'});const [rows]=await pool.execute('SELECT episode,kind,created_at AS createdAt FROM episode_events WHERE user_id=? AND media_id=? ORDER BY created_at DESC LIMIT 30',[uid(req),id]);return res.json(rows)}));
// AniList GraphQL com fila, cache, timeout e espera simples em caso de 429.
const FIELDS=`id type isAdult title{romaji english native} coverImage{large extraLarge} bannerImage averageScore seasonYear episodes chapters duration genres description(asHtml:false) siteUrl status format season popularity favourites trailer{id site thumbnail} externalLinks{site url type isDisabled language} studios(isMain:true){nodes{name}} staff(perPage:8){nodes{name{full}}}`;
const DETAIL_FIELDS=`startDate{year month day} endDate{year month day} volumes tags{name rank isMediaSpoiler} rankings{rank type season year allTime context} stats{scoreDistribution{score amount} statusDistribution{status amount}} trends(sort:DATE_DESC,perPage:15){nodes{date trending popularity}}`;
const cache=new Map<string,{time:number,data:unknown}>();let lastRequest=0;let queue=Promise.resolve();
async function anilist(query:string,variables:Record<string,unknown>){const key=JSON.stringify([query,variables]);const c=cache.get(key);if(c&&Date.now()-c.time<300000)return c.data;let unlock!:()=>void;const previous=queue;queue=new Promise<void>(r=>unlock=r);await previous;try{const gap=Math.max(0,1000-(Date.now()-lastRequest));if(gap)await new Promise(r=>setTimeout(r,gap));let response:globalThis.Response;for(let attempt=0;;attempt++){lastRequest=Date.now();response=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(14000)});if(response.status===429&&attempt<2){const retry=Math.min(8000,Math.max(2000,Number(response.headers.get('retry-after')||2)*1000));await new Promise(r=>setTimeout(r,retry));continue;}break}if(!response.ok)throw new Error(`AniList indisponível (${response.status})`);const json=await response.json() as {data?:unknown,errors?:{message:string}[]};if(json.errors?.length)throw new Error('AniList: '+json.errors[0].message);cache.set(key,{time:Date.now(),data:json.data});if(cache.size>250)cache.delete(cache.keys().next().value!);return json.data;}finally{unlock()}}
async function adultAllowed(req:Request){const id=await verify(req);if(!id)return false;const u=await User.findById(id).select('adultEnabled');return Boolean(u?.adultEnabled)}
const validId=(v:unknown)=>{const id=Number(v);return Number.isSafeInteger(id)&&id>0?id:null};
app.get('/api/media',wrap(async(req,res)=>{const p=z.object({type:z.enum(['ANIME','MANGA']).default('ANIME'),search:z.string().max(100).optional(),genre:z.string().max(60).optional(),format:z.string().max(30).optional(),year:z.coerce.number().int().min(1950).max(2100).optional(),excludeNovels:z.enum(['true','false']).default('false'),sort:z.enum(['POPULARITY_DESC','SCORE_DESC','TRENDING_DESC','START_DATE_DESC','UPDATED_AT_DESC','FAVOURITES_DESC','ID_DESC']).default('POPULARITY_DESC'),page:z.coerce.number().int().min(1).max(100).default(1),adult:z.enum(['true','false']).default('false')}).safeParse(req.query);if(!p.success)return res.status(400).json({error:'Filtros inválidos'});const d=p.data;if(d.adult==='true'&&!(await adultAllowed(req)))return res.status(403).json({error:'Ative a área restrita e entre na sua conta'});const data=await anilist(`query($type:MediaType,$search:String,$page:Int,$adult:Boolean,$genre:String,$year:Int,$sort:[MediaSort],$format:MediaFormat,$excludeFormat:MediaFormat){Page(page:$page,perPage:24){pageInfo{hasNextPage total currentPage} media(type:$type,search:$search,isAdult:$adult,genre:$genre,seasonYear:$year,sort:$sort,format:$format,format_not:$excludeFormat){${FIELDS}}}}`,{type:d.type,search:d.search||undefined,page:d.page,adult:d.adult==='true',genre:d.genre||undefined,year:d.year,sort:[d.sort],format:d.format||undefined,excludeFormat:d.type==='MANGA'&&d.excludeNovels==='true'?'NOVEL':undefined});return res.json(data)}));
app.get('/api/media/:id',wrap(async(req,res)=>{const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});const type=mediaType.safeParse(req.query.type);const data=await anilist(`query($id:Int,$type:MediaType){Media(id:$id,type:$type){${FIELDS} ${DETAIL_FIELDS} characters(perPage:12,sort:ROLE){edges{role node{id name{full} image{large}}}}}}`,{id,type:type.success?type.data:undefined}) as {Media?:{isAdult?:boolean}};if(!data?.Media)return res.status(404).json({error:'Título não encontrado'});if(data.Media.isAdult&&!(await adultAllowed(req)))return res.status(403).json({error:'Conteúdo restrito'});return res.json(data)}));
app.get('/api/characters/:id',wrap(async(req,res)=>{const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});const type=mediaType.safeParse(req.query.type);const data=await anilist('query($id:Int,$type:MediaType){Media(id:$id,type:$type){isAdult title{romaji english} characters(perPage:50,sort:ROLE){edges{role node{id name{full native} image{large} description gender} voiceActors(language:JAPANESE){id name{full} image{large} languageV2}}}}}}',{id,type:type.success?type.data:undefined}) as {Media?:{isAdult?:boolean}};if(data.Media?.isAdult&&!(await adultAllowed(req)))return res.status(403).json({error:'Conteúdo restrito'});return res.json(data)}));
app.get('/api/character/:id',wrap(async(req,res)=>{const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});const data=await anilist('query($id:Int){Character(id:$id){id name{full native} image{large} description gender dateOfBirth{year month day} media(perPage:12,sort:POPULARITY_DESC){nodes{id type isAdult title{romaji english} coverImage{large}}}}}',{id}) as {Character?:{media?:{nodes?:{isAdult?:boolean}[]}}};if(data.Character?.media?.nodes&&!(await adultAllowed(req)))data.Character.media.nodes=data.Character.media.nodes.filter(x=>!x.isAdult);return res.json(data)}));
app.get('/api/avatars',auth,wrap(async(req,res)=>{const p=z.object({search:z.string().max(80).default(''),page:z.coerce.number().int().min(1).max(30).default(1)}).safeParse(req.query);if(!p.success)return res.status(400).json({error:'Busca inválida'});const d=p.data;const data=await anilist('query($search:String,$page:Int){Page(page:$page,perPage:24){pageInfo{hasNextPage} characters(search:$search,sort:FAVOURITES_DESC){id name{full} image{large}}}}',{search:d.search||undefined,page:d.page});return res.json(data)}));
app.get('/api/airing',wrap(async(_req,res)=>{const now=Math.floor(Date.now()/1000);const data=await anilist('query($now:Int){Page(page:1,perPage:50){airingSchedules(airingAt_greater:$now,sort:TIME){id episode airingAt media{id isAdult title{romaji english} coverImage{large}}}}}',{now}) as {Page?:{airingSchedules?:{media?:{isAdult?:boolean}}[]}};if(data.Page?.airingSchedules)data.Page.airingSchedules=data.Page.airingSchedules.filter(x=>!x.media?.isAdult);return res.json(data)}));
// Comunidade: reviews e relações sociais pertencem ao OtakuVault (não alteram a conta AniList).
const socialUser=(u:any)=>({id:String(u.id),name:u.name,avatar:u.avatar||'',bio:u.bio||'',createdAt:u.createdAt});
const safePage=(v:unknown)=>Math.max(1,Math.min(30,Number.parseInt(String(v||1),10)||1));
const socialLimit=rateLimit({windowMs:15*60*1000,limit:50,standardHeaders:'draft-7',legacyHeaders:false});
const reviewLimit=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false});
const mediaType=z.enum(['ANIME','MANGA']);
async function visibleAccount(req:Request,id:string){
  if(!mongoose.isValidObjectId(id))return null;
  const user=await User.findById(id);
  if(!user || (user.profilePublic===false && await verify(req)!==id))return null;
  return user;
}
async function attachAuthors(rows:RowDataPacket[],req:Request){
  const ids=[...new Set(rows.map(r=>String(r.user_id||'')).filter(Boolean))];
  if(!ids.length)return [];
  const users=await User.find({_id:{$in:ids}}).select('name avatar bio profilePublic');
  const authors=new Map(users.map(u=>[String(u.id),u]));
  const viewer=await verify(req);
  return rows.filter(r=>{const u=authors.get(String(r.user_id));return u&&(u.profilePublic!==false||viewer===String(u.id));}).map(r=>{
    const u=authors.get(String(r.user_id))!;
    return {id:String(r.id),userId:String(r.user_id),author:socialUser(u),mediaId:r.media_id,
      mediaType:r.media_type,mediaFormat:r.media_format,mediaTitle:r.media_title,
      mediaCover:r.media_cover,title:r.title,body:r.body,score:r.score,spoiler:Boolean(r.spoiler),
      createdAt:r.created_at,updatedAt:r.updated_at};
  });
}
async function mediaFacts(id:number,type:'ANIME'|'MANGA'){
  const result=await anilist('query($id:Int,$type:MediaType){Media(id:$id,type:$type){id isAdult format title{romaji english} coverImage{large}}}',{id,type}) as {Media?:{id:number;isAdult:boolean;format?:string;title:{romaji:string;english?:string};coverImage?:{large:string}}};
  if(!result?.Media)throw new Error('Título não encontrado na AniList');
  return result.Media;
}
app.get('/api/social/reviews',wrap(async(req,res)=>{
  const page=safePage(req.query.page);const [rows]=await pool.execute<RowDataPacket[]>('SELECT * FROM reviews WHERE is_adult=0 ORDER BY updated_at DESC LIMIT 18 OFFSET ?',[(page-1)*18]);
  return res.json({items:await attachAuthors(rows,req),hasMore:rows.length===18});
}));
app.get('/api/social/users',wrap(async(req,res)=>{
  const query=z.string().max(70).safeParse(req.query.search||'');if(!query.success)return res.status(400).json({error:'Busca inválida'});
  const term=query.data.trim();const match=term?{name:{$regex:term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}:{};
  const users=await User.find({...match,profilePublic:{$ne:false}}).sort({createdAt:-1}).limit(24);
  return res.json(users.map(socialUser));
}));
app.get('/api/users/:id',wrap(async(req,res)=>{
  const id=req.params.id;const u=await visibleAccount(req,id);if(!u)return res.status(404).json({error:'Perfil não encontrado ou privado'});
  const [followRows]=await pool.execute<RowDataPacket[]>('SELECT (SELECT COUNT(*) FROM follows WHERE followed_id=?) AS followers,(SELECT COUNT(*) FROM follows WHERE follower_id=?) AS following',[id,id]);
  const [statsRows]=await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN l.favorite=1 THEN 1 ELSE 0 END) AS favorites,
    SUM(CASE WHEN l.media_type='ANIME' THEN 1 ELSE 0 END) AS animes,
    SUM(CASE WHEN l.media_type='MANGA' AND s.media_format='NOVEL' THEN 1 ELSE 0 END) AS novels,
    SUM(CASE WHEN l.media_type='MANGA' AND (s.media_format<>'NOVEL' OR s.media_format IS NULL) THEN 1 ELSE 0 END) AS mangas,
    SUM(CASE WHEN l.status='CURRENT' THEN 1 ELSE 0 END) AS current,
    SUM(CASE WHEN l.status='COMPLETED' THEN 1 ELSE 0 END) AS completed
    FROM library_entries l LEFT JOIN user_media_snapshots s ON s.user_id=l.user_id AND s.media_id=l.media_id
    WHERE l.user_id=? AND (s.is_adult=0 OR s.is_adult IS NULL)`,[id]);
  const [reviewRows]=await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS reviews FROM reviews WHERE user_id=? AND is_adult=0',[id]);
  const me=await verify(req);let isFollowing=false;
  if(me && me!==id){const [rows]=await pool.execute<RowDataPacket[]>('SELECT 1 FROM follows WHERE follower_id=? AND followed_id=?',[me,id]);isFollowing=rows.length>0}
  const counts={followers:Number(followRows[0]?.followers||0),following:Number(followRows[0]?.following||0),reviews:Number(reviewRows[0]?.reviews||0),...statsRows[0]};
  return res.json({user:socialUser(u),counts,isOwn:me===id,isFollowing,showLibrary:u.showLibrary!==false||me===id,showActivity:u.showActivity!==false||me===id});
}));
app.get('/api/users/:id/library',wrap(async(req,res)=>{
  const u=await visibleAccount(req,req.params.id);if(!u)return res.status(404).json({error:'Perfil não encontrado'});
  if(u.showLibrary===false && await verify(req)!==String(u.id))return res.status(403).json({error:'Biblioteca privada'});
  const [rows]=await pool.execute<RowDataPacket[]>(`SELECT l.media_id AS mediaId,l.media_type AS mediaType,l.status,l.progress,l.favorite,
    s.title,s.cover,s.media_format AS mediaFormat,s.total,l.updated_at AS updatedAt
    FROM library_entries l JOIN user_media_snapshots s ON s.media_id=l.media_id AND s.user_id=l.user_id
    WHERE l.user_id=? AND s.is_adult=0 ORDER BY l.updated_at DESC LIMIT 150`,[String(u.id)]);
  return res.json(rows);
}));
app.get('/api/users/:id/reviews',wrap(async(req,res)=>{
  const u=await visibleAccount(req,req.params.id);if(!u)return res.status(404).json({error:'Perfil não encontrado'});
  const offset=(safePage(req.query.page)-1)*15;
  const [rows]=await pool.execute<RowDataPacket[]>('SELECT * FROM reviews WHERE user_id=? AND is_adult=0 ORDER BY updated_at DESC LIMIT 15 OFFSET ?',[String(u.id),offset]);
  return res.json({items:await attachAuthors(rows,req),hasMore:rows.length===15});
}));
app.get('/api/reviews/media/:id',wrap(async(req,res)=>{
  const mediaId=validId(req.params.id);const kind=mediaType.safeParse(req.query.type);
  if(!mediaId||!kind.success)return res.status(400).json({error:'ID ou tipo inválido'});
  const allowAdult=await adultAllowed(req);
  const offset=(safePage(req.query.page)-1)*12;
  const [rows]=await pool.execute<RowDataPacket[]>(`SELECT * FROM reviews WHERE media_id=? AND media_type=? AND (is_adult=0 OR ?=1) ORDER BY updated_at DESC LIMIT 12 OFFSET ?`,[mediaId,kind.data,allowAdult?1:0,offset]);
  return res.json({items:await attachAuthors(rows,req),hasMore:rows.length===12});
}));
app.put('/api/reviews',auth,reviewLimit,wrap(async(req,res)=>{
  const parsed=z.object({mediaId:z.number().int().positive(),mediaType:mediaType,
    title:z.string().trim().min(3).max(120),body:z.string().trim().min(30).max(6000),
    score:z.number().int().min(1).max(100),spoiler:z.boolean().default(false)}).strict().safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Escreva um título (3–120), texto (30–6000) e nota de 1 a 100.'});
  const d=parsed.data;const facts=await mediaFacts(d.mediaId,d.mediaType);
  if(facts.isAdult&&!(await adultAllowed(req)))return res.status(403).json({error:'Conteúdo restrito'});
  const mediaTitle=facts.title?.english||facts.title?.romaji||'Sem título';
  await pool.execute(`INSERT INTO reviews (user_id,media_id,media_type,media_format,is_adult,title,body,score,spoiler,media_title,media_cover)
    VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),body=VALUES(body),score=VALUES(score),spoiler=VALUES(spoiler),updated_at=CURRENT_TIMESTAMP`,
    [uid(req),d.mediaId,d.mediaType,facts.format||'',facts.isAdult?1:0,d.title,d.body,d.score,d.spoiler?1:0,mediaTitle,facts.coverImage?.large||'']);
  if(!facts.isAdult){await pool.execute(`INSERT INTO activity_events (user_id,action,media_id,media_type,media_title,media_cover,is_adult) VALUES (?,'REVIEW',?,?,?,?,0)`,[uid(req),d.mediaId,d.mediaType,mediaTitle,facts.coverImage?.large||'']);}
  return res.json({ok:true});
}));
app.delete('/api/reviews/:id',auth,wrap(async(req,res)=>{
  const id=validId(req.params.id);const kind=mediaType.safeParse(req.query.type);
  if(!id||!kind.success)return res.status(400).json({error:'ID ou tipo inválido'});
  await pool.execute('DELETE FROM reviews WHERE user_id=? AND media_id=? AND media_type=?',[uid(req),id,kind.data]);
  await pool.execute("DELETE FROM activity_events WHERE user_id=? AND media_id=? AND media_type=? AND action='REVIEW'",[uid(req),id,kind.data]);
  return res.json({ok:true});
}));
app.post('/api/users/:id/follow',auth,socialLimit,wrap(async(req,res)=>{
  const id=req.params.id;if(!mongoose.isValidObjectId(id))return res.status(400).json({error:'Conta inválida'});
  if(id===uid(req))return res.status(400).json({error:'Você não pode seguir a si mesmo'});
  const u=await visibleAccount(req,id);if(!u)return res.status(404).json({error:'Conta inexistente ou privada'});
  await pool.execute('INSERT IGNORE INTO follows (follower_id,followed_id) VALUES (?,?)',[uid(req),id]);return res.json({ok:true,following:true});
}));
app.delete('/api/users/:id/follow',auth,wrap(async(req,res)=>{
  const id=req.params.id;if(!mongoose.isValidObjectId(id))return res.status(400).json({error:'Conta inválida'});
  await pool.execute('DELETE FROM follows WHERE follower_id=? AND followed_id=?',[uid(req),id]);return res.json({ok:true,following:false});
}));
app.get('/api/users/:id/:list(followers|following)',wrap(async(req,res)=>{
  const id=req.params.id;const u=await visibleAccount(req,id);if(!u)return res.status(404).json({error:'Perfil indisponível'});
  const field=req.params.list==='followers'?'follower_id':'followed_id';const where=req.params.list==='followers'?'followed_id':'follower_id';
  const [rows]=await pool.query<RowDataPacket[]>(`SELECT ${field} AS user_id FROM follows WHERE ${where}=? ORDER BY created_at DESC LIMIT 80`,[id]);
  const people=await User.find({_id:{$in:rows.map(r=>r.user_id)},profilePublic:{$ne:false}}).select('name avatar bio');
  const userMap=new Map(people.map(p=>[String(p.id),socialUser(p)]));return res.json(rows.map(r=>userMap.get(String(r.user_id))).filter(Boolean));
}));
app.get('/api/feed',auth,wrap(async(req,res)=>{
  const [follows]=await pool.execute<RowDataPacket[]>('SELECT followed_id FROM follows WHERE follower_id=? ORDER BY created_at DESC LIMIT 200',[uid(req)]);
  if(!follows.length)return res.json({items:[]});
  const users=await User.find({_id:{$in:follows.map(r=>r.followed_id)},profilePublic:{$ne:false},showActivity:{$ne:false}}).select('name avatar');
  if(!users.length)return res.json({items:[]});
  const placeholders=users.map(()=>'?').join(',');
  const [rows]=await pool.query<RowDataPacket[]>(`SELECT * FROM activity_events WHERE user_id IN (${placeholders}) AND is_adult=0 ORDER BY created_at DESC LIMIT 40`,users.map(u=>String(u.id)));
  const map=new Map(users.map(u=>[String(u.id),socialUser(u)]));
  return res.json({items:rows.map(r=>({id:String(r.id),user:map.get(String(r.user_id)),action:r.action,mediaId:r.media_id,mediaType:r.media_type,mediaTitle:r.media_title,mediaCover:r.media_cover,createdAt:r.created_at}))});
}));
app.get('/api/users/:id/activity',wrap(async(req,res)=>{
  const u=await visibleAccount(req,req.params.id);if(!u)return res.status(404).json({error:'Perfil não encontrado'});
  if(u.showActivity===false && await verify(req)!==String(u.id))return res.status(403).json({error:'Atividade privada'});
  const [rows]=await pool.execute<RowDataPacket[]>('SELECT * FROM activity_events WHERE user_id=? AND is_adult=0 ORDER BY created_at DESC LIMIT 30',[String(u.id)]);
  return res.json({items:rows.map(r=>({id:String(r.id),action:r.action,mediaId:r.media_id,mediaType:r.media_type,mediaTitle:r.media_title,mediaCover:r.media_cover,createdAt:r.created_at}))});
}));

// Fórum simples com tópicos e respostas, sem conteúdo adulto.
const forumLimit=rateLimit({windowMs:15*60*1000,limit:18,standardHeaders:'draft-7',legacyHeaders:false});
const topicSchema=z.object({title:z.string().trim().min(5).max(140),body:z.string().trim().min(20).max(8000),category:z.enum(['GERAL','ANIMES','MANGAS','NOVELS','RECOMENDACOES']).default('GERAL')});
const replySchema=z.object({body:z.string().trim().min(2).max(4000)});
async function forumAuthors(rows:RowDataPacket[]){const ids=[...new Set(rows.map(r=>String(r.user_id)))];const authors=await User.find({_id:{$in:ids}}).select('name avatar');const map=new Map(authors.map(u=>[String(u.id),socialUser(u)]));return rows.map(r=>({...r,id:Number(r.id),author:map.get(String(r.user_id))||{id:String(r.user_id),name:'Conta excluída',avatar:'',bio:''}}));}
app.get('/api/forum',wrap(async(req,res)=>{
 const page=safePage(req.query.page),category=z.enum(['GERAL','ANIMES','MANGAS','NOVELS','RECOMENDACOES','ALL']).safeParse(req.query.category||'ALL');
 if(!category.success)return res.status(400).json({error:'Categoria inválida'});
 const where=category.data==='ALL'?'':'WHERE t.category=?',values=category.data==='ALL'?[]:[category.data];
 const [rows]=await pool.query<RowDataPacket[]>(`SELECT t.id,t.user_id,t.title,t.category,t.created_at AS createdAt,t.updated_at AS updatedAt,COUNT(r.id) AS replies FROM forum_threads t LEFT JOIN forum_replies r ON r.thread_id=t.id ${where} GROUP BY t.id ORDER BY t.updated_at DESC LIMIT 20 OFFSET ?`,[...values,(page-1)*20]);
 return res.json({items:await forumAuthors(rows),hasMore:rows.length===20});
}));
app.post('/api/forum',auth,forumLimit,wrap(async(req,res)=>{
 const d=topicSchema.safeParse(req.body);if(!d.success)return res.status(400).json({error:'Título de 5–140 caracteres e texto de 20–8000 caracteres são obrigatórios'});
 const [result]=await pool.execute<import('mysql2/promise').ResultSetHeader>('INSERT INTO forum_threads(user_id,title,body,category) VALUES (?,?,?,?)',[uid(req),d.data.title,d.data.body,d.data.category]);
 return res.status(201).json({id:result.insertId});
}));
app.get('/api/forum/:id',wrap(async(req,res)=>{
 const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});
 const [thread]=await pool.execute<RowDataPacket[]>('SELECT id,user_id,title,body,category,created_at AS createdAt,updated_at AS updatedAt FROM forum_threads WHERE id=?',[id]);
 if(!thread.length)return res.status(404).json({error:'Tópico não encontrado'});
 const [replies]=await pool.execute<RowDataPacket[]>('SELECT id,user_id,body,created_at AS createdAt,updated_at AS updatedAt FROM forum_replies WHERE thread_id=? ORDER BY created_at ASC LIMIT 200',[id]);
 const authors=await forumAuthors([...thread,...replies]);return res.json({topic:authors[0],replies:authors.slice(1)});
}));
app.put('/api/forum/:id',auth,forumLimit,wrap(async(req,res)=>{
 const id=validId(req.params.id),d=topicSchema.safeParse(req.body);if(!id||!d.success)return res.status(400).json({error:'Dados inválidos'});
 const [result]=await pool.execute<import('mysql2/promise').ResultSetHeader>('UPDATE forum_threads SET title=?,body=?,category=? WHERE id=? AND user_id=?',[d.data.title,d.data.body,d.data.category,id,uid(req)]);
 if(!result.affectedRows)return res.status(404).json({error:'Tópico não encontrado ou sem permissão'});return res.json({ok:true});
}));
app.delete('/api/forum/:id',auth,wrap(async(req,res)=>{
 const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});
 const [result]=await pool.execute<import('mysql2/promise').ResultSetHeader>('DELETE FROM forum_threads WHERE id=? AND user_id=?',[id,uid(req)]);
 if(!result.affectedRows)return res.status(404).json({error:'Tópico não encontrado ou sem permissão'});
 await pool.execute('DELETE FROM forum_replies WHERE thread_id=?',[id]);return res.json({ok:true});
}));
app.post('/api/forum/:id/replies',auth,forumLimit,wrap(async(req,res)=>{
 const id=validId(req.params.id),d=replySchema.safeParse(req.body);if(!id||!d.success)return res.status(400).json({error:'Resposta inválida'});
 const [threads]=await pool.execute<RowDataPacket[]>('SELECT id FROM forum_threads WHERE id=?',[id]);if(!threads.length)return res.status(404).json({error:'Tópico não encontrado'});
 await pool.execute('INSERT INTO forum_replies(thread_id,user_id,body) VALUES (?,?,?)',[id,uid(req),d.data.body]);
 await pool.execute('UPDATE forum_threads SET updated_at=CURRENT_TIMESTAMP WHERE id=?',[id]);return res.status(201).json({ok:true});
}));
app.delete('/api/forum/replies/:id',auth,wrap(async(req,res)=>{
 const id=validId(req.params.id);if(!id)return res.status(400).json({error:'ID inválido'});
 await pool.execute('DELETE FROM forum_replies WHERE id=? AND user_id=?',[id,uid(req)]);return res.json({ok:true});
}));

app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.use((err:Error,_req:Request,res:Response,_next:NextFunction)=>{console.error('[API]',err);res.status(500).json({error:'Erro interno. Tente novamente.'})});
async function initializeDatabase(){await pool.query(`CREATE TABLE IF NOT EXISTS user_media_snapshots (user_id VARCHAR(24) NOT NULL,media_id INT NOT NULL,title VARCHAR(300) NOT NULL,cover VARCHAR(1200) NOT NULL DEFAULT '',is_adult BOOLEAN NOT NULL DEFAULT FALSE,total INT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(user_id,media_id))`);await pool.query(`CREATE TABLE IF NOT EXISTS episode_events (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(24) NOT NULL,media_id INT NOT NULL,episode INT NOT NULL,kind ENUM('ANIME','MANGA') NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX idx_user_media_date(user_id,media_id,created_at))`);
  // Migração incremental: nunca remove dados nem exige reinicializar volumes Docker.
  try{await pool.query('ALTER TABLE user_media_snapshots ADD COLUMN media_format VARCHAR(30) NOT NULL DEFAULT \'\'')}catch(e:any){if(e.code!=='ER_DUP_FIELDNAME')throw e}
  await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL, media_id INT NOT NULL, media_type ENUM('ANIME','MANGA') NOT NULL,
    media_format VARCHAR(30) NOT NULL DEFAULT '', is_adult BOOLEAN NOT NULL DEFAULT FALSE,
    title VARCHAR(120) NOT NULL, body TEXT NOT NULL, score TINYINT UNSIGNED NOT NULL,
    spoiler BOOLEAN NOT NULL DEFAULT FALSE,
    media_title VARCHAR(300) NOT NULL DEFAULT '', media_cover VARCHAR(1200) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_review(user_id,media_type,media_id), INDEX idx_media_review(media_type,media_id,updated_at),
    INDEX idx_user_review(user_id,updated_at))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS follows (
    follower_id VARCHAR(24) NOT NULL, followed_id VARCHAR(24) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(follower_id,followed_id), INDEX idx_followed(followed_id,created_at))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS activity_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(24) NOT NULL,
    action ENUM('REVIEW','LIBRARY') NOT NULL, media_id INT NOT NULL,
    media_type ENUM('ANIME','MANGA') NOT NULL, media_title VARCHAR(300) NOT NULL DEFAULT '',
    media_cover VARCHAR(1200) NOT NULL DEFAULT '', is_adult BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_user_activity(user_id,created_at))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS forum_threads (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(24) NOT NULL,title VARCHAR(140) NOT NULL,body TEXT NOT NULL,category ENUM('GERAL','ANIMES','MANGAS','NOVELS','RECOMENDACOES') NOT NULL DEFAULT 'GERAL',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_forum_time(updated_at))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS forum_replies (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,thread_id BIGINT UNSIGNED NOT NULL,user_id VARCHAR(24) NOT NULL,body TEXT NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_thread_time(thread_id,created_at))`);
}
async function start(){await mongoose.connect(mongo);await pool.query('SELECT 1');await initializeDatabase();verifyMailConnection().then(()=>console.log('[SMTP] Serviço de e-mail pronto')).catch(e=>console.warn('[SMTP] Verifique SMTP_HOST/PORT/credenciais:',e.message));app.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('OtakuVault API: http://0.0.0.0:'+(process.env.PORT||3001)))}
start().catch(e=>{console.error('[Startup]',e);process.exit(1)});
