# OtakuVault — correção de HTTP 502 em todas as rotas /api

## O que foi identificado

O servidor Nginx do frontend envia `/api/*` para `http://backend:3001`.
Um erro **502** simultâneo em `/api/me`, `/api/auth/register`, `/api/media` e `/api/airing` normalmente significa que o backend está parado, reiniciando ou não escutando nessa porta — e não que a AniList tenha falhado.

Na versão v3 anterior, `backend/src/mailer.ts` interrompia o processo durante o carregamento do módulo quando `SMTP_HOST` não existia no `.env`. O servidor não iniciava e o Nginx respondia com 502.

### Correções desta atualização

- `backend/src/mailer.ts`: o SMTP é validado apenas quando é necessário conectar/enviar e-mail. Se faltar configuração, **o catálogo e as outras rotas continuam disponíveis**, enquanto cadastro/reenvio/recuperação de senha informam uma falha de e-mail.
- `docker-compose.yml`: fornece `SMTP_HOST=mailpit` e `SMTP_PORT=1025` como padrões **somente para o ambiente de desenvolvimento**. As variáveis do `.env` continuam tendo prioridade.
- `backend` tem **healthcheck** usando `/api/health`.
- O `frontend` espera o backend ficar saudável antes de iniciar, evitando uma falha temporária de proxy durante a inicialização.

## Como aplicar sem apagar dados

1. Faça backup da pasta atual. Extraia esta versão e preserve **seu** `.env` com as senhas de MongoDB/MySQL/JWT.
2. Para testes locais, abra `.env` e confirme:

```dotenv
APP_ENV=development
APP_PUBLIC_URL=http://localhost:5173
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_REQUIRE_TLS=false
SMTP_FROM="OtakuVault <nao-responda@otakuvault.local>"
COOKIE_SECURE=false
```

3. Reconstrua os serviços:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
```

4. Teste a saúde da API:

```powershell
Invoke-RestMethod http://localhost:5173/api/health
```

O resultado esperado é `{ "ok": true }`. Abra `http://localhost:8025` para ver os e-mails de verificação enviados para o Mailpit.

## Se ainda aparecer 502

Execute estes comandos **sem compartilhar senhas ou conteúdo do `.env`**:

```powershell
docker compose ps -a
docker compose logs --tail=120 backend
docker compose logs --tail=60 mongo
docker compose logs --tail=60 mysql
```

Como interpretar:

- `SMTP_HOST é obrigatório`: imagem antiga ainda em execução ou configuração antiga. Reconstrua com `docker compose up --build -d`.
- `JWT_SECRET deve ter ao menos 32 caracteres`: corrija a variável `JWT_SECRET` no `.env` (sem colar a senha em mensagens).
- `MongoServerError: Authentication failed`: confira as credenciais MongoDB que **já foram usadas para inicializar o volume**. Alterar `.env` não altera automaticamente credenciais existentes.
- `Access denied for user`: verifique a senha do usuário MySQL existente no volume.
- `[Startup]` com erro SQL: investigue a primeira mensagem de erro no log do backend.
- A imagem Docker não compilou: execute `docker compose --progress plain build backend --no-cache` e procure por `error TS`.

**Não execute `docker compose down -v`: isso exclui os bancos persistidos.**

## Teste do fluxo de e-mail

Após `/api/health` retornar `ok`, crie uma conta de teste e abra `http://localhost:8025` para confirmar o endereço. Você também pode rodar:

```powershell
node .\scripts\smoke-test-email.mjs
```

O Mailpit é exclusivo para desenvolvimento; para mensagens reais use um servidor SMTP autorizado e seu próprio domínio com HTTPS.
