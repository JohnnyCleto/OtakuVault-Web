// Teste end-to-end local de validação, reuso de tokens e recuperação de senha.
// Requer Docker com Mailpit e acesso ao backend. Cria uma conta descartável
// e a remove, sem imprimir os tokens nos logs.
import {getMailToken} from './mailpit-test-helper.mjs';
const base=process.env.BASE_URL||'http://localhost:5173';
const email=`otaku_email_${Date.now()}@example.invalid`;
const original='SenhaTeste#2026';const updated='SenhaAlterada#2026';
let cookie='',created=false,failed=false;
async function request(path,method='GET',body,expected=200){
 const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const json=await r.json().catch(()=>({}));
 if(r.status!==expected)throw Error(`${method} ${path}: HTTP ${r.status}, esperado ${expected}: ${JSON.stringify(json)}`);
 if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
 console.log(`OK ${r.status} ${method} ${path}`);
 return json;
}
try{
 await request('/health');
 await request('/auth/register','POST',{name:'Conta Verificável',email,password:original},201);created=true;
 await request('/auth/login','POST',{email,password:original},403);
 const verifyToken=await getMailToken(email,'verify');
 await request('/auth/verify-email','POST',{token:verifyToken});
 await request('/auth/verify-email','POST',{token:verifyToken},400);
 await request('/auth/login','POST',{email,password:original});
 const user=await request('/me');if(!user.emailVerified)throw Error('Conta não ficou verificada');
 await request('/auth/forgot-password','POST',{email});
 const resetToken=await getMailToken(email,'reset');
 await request('/auth/reset-password','POST',{token:resetToken,password:updated});
 await request('/auth/reset-password','POST',{token:resetToken,password:updated},400);
 await request('/me','GET',undefined,401); // JWT anterior invalidado
 cookie='';await request('/auth/login','POST',{email,password:original},401);
 await request('/auth/login','POST',{email,password:updated});
 await request('/me','DELETE',{password:updated});created=false;
 console.log('TESTE DE E-MAIL: OK');
}catch(err){failed=true;console.error('TESTE DE E-MAIL FALHOU:',err.message)}
finally{if(created){try{if(!cookie)await request('/auth/login','POST',{email,password:updated});await request('/me','DELETE',{password:updated});}catch(e){console.error('Conta de teste pendente:',email,e.message)}}}
process.exitCode=failed?1:0;
