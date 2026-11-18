// Leitura da caixa de testes Mailpit. Não funciona com SMTP de produção.
const mailpit=process.env.MAILPIT_URL||'http://localhost:8025';
export async function getMailToken(email,kind='verify'){
 const subject=kind==='verify'?'Confirme seu e-mail':'Redefina sua senha';
 const expectedPath=kind==='verify'?'/verificar-email':'/redefinir-senha';
 for(let attempt=0;attempt<24;attempt++){
  const response=await fetch(`${mailpit}/api/v1/messages`);
  if(!response.ok)throw Error('Mailpit indisponível: http://localhost:8025');
  const data=await response.json();
  const item=(data.messages||[]).find(m=>m.Subject?.includes(subject)&&(m.To||[]).some(t=>t.Address?.toLowerCase()===email.toLowerCase()));
  if(item){
   const msg=await (await fetch(`${mailpit}/api/v1/message/${encodeURIComponent(item.ID)}`)).json();
   const url=(msg.Text||'').split(/\s+/).find(s=>s.includes(expectedPath+'#token='));
   if(url){const token=new URLSearchParams(new URL(url).hash.slice(1)).get('token');if(token&&/^[a-f0-9]{64}$/.test(token))return token;}
  }
  await new Promise(r=>setTimeout(r,350));
 }
 throw Error(`Nenhum e-mail de ${kind} encontrado para ${email} no Mailpit`);
}
export async function verifyNewAccount(email,base='http://localhost:5173'){
 const token=await getMailToken(email,'verify');
 const result=await fetch(`${base}/api/auth/verify-email`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
 if(!result.ok)throw Error(`Falha ao confirmar e-mail: ${result.status} ${await result.text()}`);
}
