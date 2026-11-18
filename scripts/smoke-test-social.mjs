import {verifyNewAccount} from './mailpit-test-helper.mjs';
// Teste de integração social em instância LOCAL. Cria duas contas e tenta removê-las ao final.
const base=process.env.BASE_URL||'http://localhost:5173';
const password='SmokeTest#2026Social';const stamp=Date.now();
const users=[{name:'Social Teste A',email:`otaku_social_a_${stamp}@example.invalid`,cookie:''},{name:'Social Teste B',email:`otaku_social_b_${stamp}@example.invalid`,cookie:''}];
let failed=false,threadId=null;
async function call(user,path,method='GET',body,expected=200){const result=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(user?.cookie?{Cookie:user.cookie}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});const payload=await result.json().catch(()=>({}));const setCookie=result.headers.get('set-cookie');if(user&&setCookie)user.cookie=setCookie.split(';')[0];if(result.status!==expected)throw Error(`${method} ${path}: esperado ${expected}, recebido ${result.status}: ${JSON.stringify(payload)}`);console.log('OK',result.status,method,path);return payload;}
try{
 await call(null,'/health');
 for(const u of users){await call(u,'/auth/register','POST',{name:u.name,email:u.email,password},201);await verifyNewAccount(u.email,base);const me=await call(u,'/auth/login','POST',{email:u.email,password},200);u.id=me.id}
 const [a,b]=users;
 const profile=await call(a,'/users/'+b.id);if(profile.user.id!==b.id)throw Error('Perfil incorreto');
 await call(a,'/users/'+b.id+'/follow','POST');
 const bData=await call(b,'/users/'+b.id);if(Number(bData.counts.followers)<1)throw Error('Seguidor não foi registrado');
 const people=await call(a,'/social/users?search=Social%20Teste');if(!people.some(x=>x.id===b.id))throw Error('Usuário não apareceu na busca');
 const feed=await call(a,'/feed');if(!Array.isArray(feed.items))throw Error('Feed inválido');
 const topic=await call(a,'/forum','POST',{title:'Discussão temporária de integração',body:'Teste local automatizado do fórum e seus relacionamentos.',category:'GERAL'},201);threadId=topic.id;
 await call(b,`/forum/${threadId}/replies`,'POST',{body:'Resposta do teste social'},201);
 const page=await call(null,'/forum/'+threadId);if(page.replies?.length!==1)throw Error('Resposta do fórum ausente');
 await call(b,'/me','PATCH',{profilePublic:false,showLibrary:false,showActivity:false});
 await call(a,'/users/'+b.id,'GET',undefined,404);
 await call(b,'/users/'+b.id); // proprietário ainda pode visualizar o perfil privado
 await call(a,'/users/'+b.id+'/follow','DELETE');
 await call(a,'/forum/'+threadId,'DELETE');threadId=null;
 console.log('TESTE SOCIAL: OK');
}catch(e){failed=true;console.error('FALHA SOCIAL:',e.message)}
finally{
 if(threadId&&users[0].id){try{await call(users[0],'/forum/'+threadId,'DELETE')}catch{}}
 for(const u of users){if(!u.id)continue;try{await call(u,'/me','DELETE',{password})}catch(e){failed=true;console.error('Conta de teste não excluída:',u.email,e.message)}}
}
process.exitCode=failed?1:0;
