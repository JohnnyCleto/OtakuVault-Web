# OtakuVault Web — Comunidade, Reviews, Light Novels, Rankings e Fórum

Este pacote amplia o **OtakuVault Web Full Stack** com novos recursos sociais e uma tela de detalhes inspirada nas capturas do AniList (sem copiar o serviço ou sua marca). A aplicação **não publica avaliações nem segue contas no AniList**: essas operações acontecem entre usuários cadastrados no **seu próprio OtakuVault**.

## Tecnologias

- **Frontend:** React 18 + Vite 6 + React Router 7 + TypeScript + Lucide.
- **Backend:** Express + Node.js 22 + TypeScript + JWT em cookie HttpOnly + Argon2.
- **MongoDB:** contas, perfil, bio, avatar, preferências e configuração de privacidade.
- **MySQL:** biblioteca, histórico, episódios, reviews, relações entre usuários, feed e fórum.
- **Docker Compose:** frontend Nginx, backend Express, MongoDB e MySQL.
- **AniList GraphQL:** somente metadados de mídia, popularidade, rankings, distribuições, personagens e light novels (tipo `MANGA`, formato `NOVEL`).

## Funcionalidades adicionadas

1. **Light Novels:** rota `/light-novels`, listagem, busca, acompanhamento de capítulos e integração à biblioteca. Elas continuam como `MANGA` no banco, com `media_format = NOVEL`.
2. **Reviews:** aba "Reviews" de cada título, nota de 1 a 100 (exibida sobre 10), título, texto, edição, exclusão, spoiler oculto e reviews recentes da comunidade. Uma review por usuário e título.
3. **Comunidade:** `/comunidade` com busca de pessoas, últimas reviews e feed de contas seguidas.
4. **Perfis públicos:** `/usuarios/:id`, com capa, avatar, bio, seguidores/seguindo, biblioteca pública, favoritos, reviews, atividade e estatísticas. `/perfil` abre sua própria versão.
5. **Seguir pessoas:** seguir/deixar de seguir; sem relação com o sistema de followers do AniList.
6. **Privacidade:** configurações de perfil público, biblioteca compartilhada e atividade compartilhada. Conteúdo adulto não é exibido em perfis nem no feed públicos.
7. **Rankings:** `/rankings`, filtros por anime/mangá/novel e popularidade/nota/tendência.
8. **Página de detalhes:** abas de sinopse, personagens, equipe, reviews, estatísticas e links, tags, rankings, distribuição de notas/status, atividade do AniList e fontes autorizadas.
9. **Fórum básico:** `/forum` e `/forum/:id`: tópicos em categorias, respostas, edição e exclusão pelo autor. Ainda não há moderação avançada, anexos nem menções.
10. **Layout:** navegação rápida no cabeçalho, cartões sociais, rankings em linhas, tabs horizontais e adaptação para celular.

## Migração a partir da versão anterior

**Faça uma cópia de segurança** da pasta e dos dados dos bancos. Não execute `docker compose down -v`: isso apagaria os volumes dos bancos.

1. Descompacte `OtakuVault-Web-Social.zip`.
2. Copie seu `.env` anterior para a raiz da pasta `OtakuVault-Web` (ou copie `.env.example` e configure todas as senhas; preserve as mesmas credenciais dos volumes existentes).
3. Abra PowerShell na pasta `OtakuVault-Web`.
4. Execute:

```powershell
# Confira o arquivo .env antes de continuar:
Get-ChildItem -Force .env*
docker compose config --quiet
docker compose --progress plain build --no-cache
docker compose up -d
docker compose ps
```

5. Acesse: **http://localhost:5173**.
6. Crie sua conta (ou entre na antiga), abra **Comunidade**, encontre seu perfil e copie seu link para os amigos.

**Importante:** O backend cria automaticamente as novas tabelas e faz a alteração incremental `media_format` ao iniciar. O script `database/mysql/init.sql` é executado somente quando o volume MySQL é criado pela primeira vez. Para dados já existentes, as alterações são feitas no `initializeDatabase()` do backend.

## Rotas novas

### Frontend

- `/light-novels`
- `/rankings`
- `/comunidade`
- `/usuarios/:id`
- `/forum`
- `/forum/:id`
- `/titulo/:id?type=MANGA` ou `?type=ANIME` (detalhes com várias abas)

### Backend

| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/api/social/users?search=...` | Buscar pessoas com perfil público |
| GET | `/api/social/reviews` | Reviews recentes (sem mídia adulta) |
| GET | `/api/users/:id` | Dados do perfil público, contagens e estado do follow |
| GET | `/api/users/:id/library` | Biblioteca pública |
| GET | `/api/users/:id/reviews` | Reviews públicas da pessoa |
| GET | `/api/users/:id/activity` | Atividade pública |
| GET | `/api/users/:id/followers` | Seguidores |
| GET | `/api/users/:id/following` | Seguindo |
| POST/DELETE | `/api/users/:id/follow` | Seguir / deixar de seguir (login) |
| GET | `/api/feed` | Feed das pessoas seguidas (login) |
| GET | `/api/reviews/media/:id?type=ANIME` | Reviews por título |
| PUT | `/api/reviews` | Criar ou alterar a própria review (login) |
| DELETE | `/api/reviews/:id?type=MANGA` | Excluir a própria review (login) |
| GET | `/api/forum` | Lista de tópicos |
| POST | `/api/forum` | Publicar tópico (login) |
| GET/PUT/DELETE | `/api/forum/:id` | Abrir / editar / excluir tópico |
| POST | `/api/forum/:id/replies` | Responder |
| DELETE | `/api/forum/replies/:id` | Excluir resposta própria |

## Onde os dados são armazenados

- MongoDB coleção `users`: nome, bio, avatar, e-mail **privado**, senha com hash, preferências e chaves `profilePublic`, `showLibrary` e `showActivity`.
- MySQL tabela `reviews`: conteúdo e nota das avaliações vinculadas ao autor e à mídia.
- MySQL tabela `follows`: relações follower/followed.
- MySQL tabela `activity_events`: eventos de reviews e atualização da biblioteca (somente conteúdo geral).
- MySQL tabelas `forum_threads` e `forum_replies`: conversas do fórum.
- MySQL tabela `user_media_snapshots`: formato da mídia e metadados cacheados.

## Verificação

```powershell
docker compose logs --tail=80 backend
docker compose logs --tail=80 frontend
node .\scripts\smoke-test.mjs
node .\scripts\smoke-test-social.mjs
```

O teste social cria **duas contas temporárias** e verifica seguidores, perfis públicos e privacidade. Ele procura excluí-las ao final, inclusive em falha; não rode testes de integração em produção.

## Limites conhecidos

- A instalação das dependências e o build Docker dependem de acesso ao npm e ao Docker no computador. **Este pacote passou por checagem de sintaxe e imports, mas não teve execução completa de build Docker neste ambiente.**
- A API pública AniList pode impor rate limits ou ficar temporariamente indisponível. Reviews e salvamento de novos títulos conferem dados AniList ao servidor para impedir falsificações de metadados públicos.
- Não há sincronização de listas, seguidores ou reviews para contas do site AniList; o banco é exclusivo do OtakuVault.
- Episódios completos e leitura integral precisam de licença e de integração autorizada; há trailers e links oficiais.
- O fórum é um MVP sem moderação avançada. Para implantação pública, recomenda-se adicionar denúncia, bloqueio de usuários, ferramentas de moderação, proteção contra abuso e política de comunidade.
- A biblioteca e o histórico herdados usam `user_id + media_id` como chave; AniList tem espaços de IDs de anime e manga distintos. Uma futura migração para chave composta incluindo o tipo de mídia é recomendada caso ocorram colisões de IDs. Reviews e seguidores já utilizam chaves adequadas.

## Segurança

Nunca versionar `.env`. Não exponha senhas ou cookies JWT nos repositórios. Ative HTTPS e `COOKIE_SECURE=true` quando publicar em domínio real. Configurações 18+ declaratórias não equivalem a verificação robusta de idade onde legalmente exigida.
