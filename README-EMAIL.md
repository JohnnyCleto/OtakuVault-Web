# OtakuVault — Cadastro com verificação por e-mail

Nesta versão, uma conta só consegue entrar após confirmar um link enviado ao endereço cadastrado. A identidade de e-mail **não é validada apenas pelo formato do endereço**: é necessário acessar a caixa de entrada e clicar no link de uso único.

## Recursos implementados

- **Cadastro pendente** (`POST /api/auth/register`): salva usuário no MongoDB com `emailVerified=false`, hash Argon2id da senha e envia mensagem via SMTP. Não cria sessão.
- **Ativação** (`POST /api/auth/verify-email`): link válido por 24 horas, token aleatório de 256 bits e consumo único.
- **Reenvio** (`POST /api/auth/resend-verification`): para contas pendentes, limitação por IP e espera mínima de 60 segundos por conta.
- **Login** (`POST /api/auth/login`): rejeita contas não verificadas com HTTP 403 e código `EMAIL_NOT_VERIFIED`.
- **Esqueci minha senha** (`POST /api/auth/forgot-password`): envia link para o e-mail do proprietário, válido por 30 minutos.
- **Redefinição** (`POST /api/auth/reset-password`): altera o hash da senha, consome o token e invalida sessões anteriores.
- **Persistência**: campos `emailVerified`, `emailVerifiedAt`, `sessionVersion` em `User` e coleção MongoDB `AuthToken` com hashes SHA-256 e índice TTL.
- **Proteções**: JWT em cookie HttpOnly + SameSite Strict, tokens brutos nunca armazenados, respostas genéricas em reenvio/recuperação, limites de taxa, `Referrer-Policy: no-referrer` e verificação da versão da sessão no servidor.

## 1. Teste local pelo Docker

Use o projeto completo, não apenas um `server.ts` isolado.

```powershell
Copy-Item .env.example .env
notepad .env
```

Se você **já tem** um `.env` funcionando, preserve suas credenciais atuais e apenas acrescente estas linhas:

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

No terminal da pasta do projeto:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Agora abra:

- **OtakuVault:** http://localhost:5173
- **Caixa de e-mails de testes (Mailpit):** http://localhost:8025

Crie uma conta no OtakuVault usando um endereço de teste. O e-mail de confirmação aparecerá na interface do Mailpit. Abra-o e clique no botão de confirmação para ativar a conta. Depois faça login. Teste também **Esqueceu a senha?**.

**Importante:** o Mailpit é uma caixa de e-mails **de desenvolvimento** e **não envia mensagens para Gmail, Outlook ou outro endereço externo**. O objetivo é validar o comportamento do aplicativo localmente. <https://mailpit.axllent.org/docs/install/docker/>

## 2. Envio de mensagens reais com um provedor SMTP

Cadastre um domínio de envio em um provedor de e-mail transacional que ofereça SMTP (por exemplo, serviço SMTP do provedor contratado). Configure SPF, DKIM e DMARC conforme as instruções do seu provedor.

Substitua no `.env` (exemplo fictício; **não copie estas credenciais**):

```dotenv
APP_ENV=production
APP_PUBLIC_URL=https://seu-dominio.com
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=usuario_smtp_real
SMTP_PASS=senha_ou_token_smtp_real
SMTP_FROM="OtakuVault <contato@seu-dominio.com>"
COOKIE_SECURE=true
```

Na porta 465, normalmente use `SMTP_SECURE=true`; na 587, `SMTP_SECURE=false` com `SMTP_REQUIRE_TLS=true`. Confira as configurações específicas de seu provedor. <https://nodemailer.com/smtp>

**HTTPS é obrigatório para uma publicação pública segura.** O backend recusa `APP_ENV=production` se `APP_PUBLIC_URL` não for HTTPS ou `COOKIE_SECURE` não estiver ativado. Configure proxy reverso, cookies seguros, domínios e proteção operacional antes de expor o aplicativo à internet. A configuração Docker incluída é destinada a desenvolvimento; prepare uma configuração de implantação separada sem Mailpit e com proteção adicional. Não publique o painel do Mailpit na internet.

### Nunca envie credenciais

Não publique `.env` no GitHub, não adicione senhas SMTP ao frontend e não forneça esses valores no chat. O arquivo `.env` já é ignorado pelo `.gitignore`.

## 3. Novas páginas

- `/login` — login ou cadastro, informando que é necessário validar o e-mail
- `/verificar-email#token=...` — confirmação do endereço
- `/reenviar-verificacao` — reenvio do link
- `/esqueci-senha` — solicitação de recuperação
- `/redefinir-senha#token=...` — cadastro de nova senha

**Links privados:** o frontend remove o token do fragmento da URL depois de lê-lo (o fragmento não é enviado em requisições HTTP) e a resposta HTTP tem política de referência `no-referrer`.

## 4. Contas anteriores à atualização

Contas criadas nas versões antigas **não possuem e-mail verificado** e, por segurança, não poderão entrar até confirmar o endereço. Use `/reenviar-verificacao` com o e-mail que estava cadastrado. As listas, reviews, seguidores e histórico dos usuários permanecem associados aos IDs existentes; o processo não apaga dados MySQL.

Se você perdeu o acesso ao endereço antigo, esta atualização ainda não inclui troca de e-mail com revalidação: a recuperação exige um fluxo adicional autenticado/administrativo com prova de titularidade.

## 5. Testes de integração local

Com todos os containers de desenvolvimento ativos:

```powershell
node .\scripts\smoke-test-email.mjs
node .\scripts\smoke-test.mjs
node .\scripts\smoke-test-social.mjs
```

Os scripts usam a API local do Mailpit para localizar os tokens **sem exibi-los no terminal** e apagar as contas temporárias que criam. Execute-os apenas em ambientes de desenvolvimento, nunca contra usuários reais.

Se aparecer erro `SMTP_HOST é obrigatório`, revise o `.env` e reconstrua o backend. Se o navegador abrir um link com host errado, corrija `APP_PUBLIC_URL`. Se o e-mail não chegar ao destinatário em produção, consulte os logs e as configurações de SMTP e DNS do domínio.

## 6. Limitações importantes

- O sistema verifica o **controle do e-mail** usado no cadastro, não verifica a identidade civil do proprietário nem a idade da pessoa.
- A confirmação de e-mail não substitui políticas de idade aplicáveis ao catálogo 18+.
- Para uso público real, ainda são necessários antispam/abuso avançado, telemetria, auditoria, backups, testes E2E em CI, gerenciamento de segredos, monitoramento de SMTP, política de privacidade e governança de dados.
- Os provedores externos são responsáveis pela entrega; configurar SMTP não garante recebimento caso DNS e reputação de domínio estejam incorretos.
