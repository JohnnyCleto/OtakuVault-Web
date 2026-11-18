# ✉️ Contas com e-mail verificado (nova atualização)

**Agora o cadastro exige confirmação por e-mail**, com reenvio e recuperação de senha por link seguro. Para testar no Docker, abra <http://localhost:8025> (Mailpit); para entrega real, configure o SMTP do seu provedor. Consulte **[README-EMAIL.md](README-EMAIL.md)** antes de atualizar o projeto.

---

# Atualização — Comunidade OtakuVault (novembro/2026)

**Novos recursos:** light novels, reviews locais com spoilers, seguir usuários, perfis públicos, feed de atividades, rankings, estatísticas por título, fórum básico e controles de privacidade. Veja [README-SOCIAL.md](README-SOCIAL.md) para instalação, rotas, migração e testes.

---

# ✦ OtakuVault Web — Edição Full Stack

Migração e expansão do aplicativo Expo **OtakuVault**, baseada em `OtakuVault(3).zip` e no patch `atualizacao-conteudo-18(1).zip` enviados pelo autor. A nova interface usa as cores originais do aplicativo: fundo `#15131f`, superfícies `#221f33`, detalhes `#ff4f8b` e texto `#f2eff8`.

## Tecnologias

| Camada | Stack | Dados |
|---|---|---|
| Frontend | React 18, Vite 6, TypeScript, React Router 7, Lucide | Interface e navegação responsiva |
| API | Node 22, Express, TypeScript, Zod, Argon2, JWT | Sessões, permissões e AniList GraphQL |
| MongoDB 7 | Mongoose | Conta, hash da senha, avatar, biografia, preferências, declaração de maioridade |
| MySQL 8.4 | mysql2 | Biblioteca, favoritos, status, progresso, snapshots dos títulos, histórico e eventos de progresso |
| Docker Compose | Nginx + 4 serviços | Deploy local, volumes persistentes |

## Instalação no Windows (PowerShell)

1. Extraia este projeto e abra a pasta **OtakuVault-Web** no terminal.
2. Copie as variáveis de exemplo:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

3. No `.env`, substitua as senhas de exemplo de `MYSQL_*`, `MONGO_INITDB_*` e `JWT_SECRET` por segredos seus (JWT_SECRET **32 ou mais caracteres**). Não publique esse arquivo.
4. Com o Docker Desktop aberto:

   ```powershell
   docker compose config --quiet
   docker compose up --build -d
   docker compose ps
   ```

5. Acesse **http://localhost:5173**.

Monitoramento:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
```

Parar sem apagar a biblioteca:

```powershell
docker compose down
```

**NÃO use `docker compose down -v`**, pois essa opção remove os volumes dos bancos e pode apagar seus dados.

### Já tenho a versão Web anterior

Faça backup da pasta e do `.env`, substitua os arquivos de código pelo conteúdo do ZIP novo e **mantenha o `.env` que já funciona com seus volumes Mongo/MySQL**. Evite trocar as credenciais de bancos já inicializados sem planejar a migração. Execute `docker compose up --build -d`.

As tabelas `user_media_snapshots` e `episode_events` são criadas pelo backend na primeira inicialização da nova versão. Não é preciso recriar os volumes. O conteúdo da biblioteca antiga continua armazenado; títulos antigos sem snapshot podem aparecer com ID até você salvá-los novamente nos detalhes.

## Funcionalidades implementadas

- **Design:** barra lateral desktop, barra superior com avatar/sininho, navegação inferior mobile, layout responsivo, cores e cartões inspirados no Expo, efeitos de hover e elementos de destaque.
- **Início:** carrossel Hero com troca automática opcional, filtros de gênero, continuar assistindo/lendo, próximos episódios, em alta, mangás populares, mais bem avaliados e recém adicionados.
- **Catálogo e busca:** animes, mangás ou ambos, pesquisa, gênero, ano, formato, ordenação, paginação e categorias.
- **Título:** banner, capa, sinopse, nota, gênero, estúdio/equipe, ficha, personagens, trailer autorizado, links oficiais, compartilhar, favorito, status e progresso.
- **Biblioteca:** dados MySQL por usuário, capas e nomes persistidos, filtros por tipo/status/pesquisa, favoritos, progresso e remoção individual/total.
- **Histórico:** visualização das visitas com capa, data, exclusão individual ou total, preferência para desabilitar registro.
- **Personagens:** lista associada ao anime, papel principal/coadjuvante, dubladores japoneses e página de perfil do personagem.
- **Novidades e sininho:** consulta à programação da AniList; destaque dos próximos episódios dos títulos em andamento; indicador configurável para a conta.
- **Perfil:** visualização, estatísticas, nome, biografia, avatar de personagem pesquisável e remoção de avatar.
- **Configurações:** autoplay, indicador de novidades, histórico, desfoque de capas 18+, ativação da área 18+, limpeza de dados, logout, exclusão de conta com confirmação de senha.
- **18+:** desativado por padrão, separado do catálogo geral, confirmação declaratória de maioridade, validação de sessão no backend e capas desfocadas por padrão.
- **Player e leitura:** trailer incorporado pelo YouTube quando disponível, links para fontes oficiais de reprodução/leitura informadas pela AniList. Não hospeda episódios completos ou capítulos protegidos por direitos autorais.

## Limitações e condições externas

- **A AniList é fonte de metadados, não provedora de filmes, episódios nem páginas de mangá.** Não existe, neste pacote, streaming de episódios completos ou leitor integrado de capítulos. Essas funções exigem licença ou API de um provedor que permita incorporação.
- **Notificações** são atualizações consultadas no aplicativo (sininho) com base nas próximas exibições; **não** são push notifications, e o resultado depende dos registros de lançamento da AniList.
- A **confirmação de maioridade é declaratória**, não é verificação documental nem substitui exigências legais aplicáveis.
- A AniList tem limites de requisições e pode estar indisponível; o servidor utiliza fila, cache de 5 minutos e tentativas limitadas após HTTP 429.
- A lista de personagens, dubladores, fontes oficiais e sinopses depende do cadastro da AniList. Alguns títulos não têm esses campos.
- O pacote foi submetido a inspeção de sintaxe e estrutura, porém **não foi compilado no Docker neste ambiente** (sem acesso ao registry npm e sem engine Docker). Teste localmente com `docker compose up --build -d` antes de publicar.
- Para produção pública: configurar HTTPS e `COOKIE_SECURE=true`, backups, privacidade, proteção CSRF/origem, limites refinados por endpoint, testes automatizados de integração, observabilidade, migrações versionadas e política de conteúdo.

## Páginas

```text
/                Início, destaques, episódios e recomendações
/busca           Busca avançada ANIME/MANGA/TODOS
/mangas          Catálogo de mangás
/categorias      Gêneros
/secao/:tipo     Em alta, melhores, recentes
/novidades       Próximos episódios
/notificacoes    Próximos episódios dos títulos da minha lista
/titulo/:id      Detalhes + player de trailer + links oficiais
/personagens/:id Personagens e dubladores de um título
/personagem/:id  Personagem individual
/favoritos       Favoritos
/minha-lista     Biblioteca e progresso
/historico       Histórico
/perfil          Perfil
/editar-perfil   Alterar nome e biografia
/escolher-avatar Escolher imagem de personagem
/configuracoes   Preferências e operações da conta
/adulto          Catálogo isolado 18+
/login           Login/cadastro
/ajuda           Como usar
/sobre           Créditos e tecnologia
```

## Estrutura

```text
OtakuVault-Web/
├── frontend/
│   ├── src/
│   │   ├── components/    Avatar, MediaCard, HeroCarousel, WatchSheet,
│   │   │                  ProgressStepper, StatusPicker, EpisodeCard...
│   │   ├── contexts/      AuthContext, LibraryContext, SettingsContext
│   │   ├── hooks/         useCatalog
│   │   ├── pages/         Home, Catalog, Details, Characters, Profile,
│   │   │                  EditProfile, ChooseAvatar, Settings, News...
│   │   ├── services/      API HTTP
│   │   ├── types/         Media, Entry, Me, Preferences
│   │   ├── App.tsx        Router e navegação
│   │   ├── main.tsx       Providers e entrada React
│   │   └── style.css      Tema web responsivo
│   ├── nginx.conf
│   └── Dockerfile
├── backend/
│   ├── src/server.ts      Rotas API + MongoDB/MySQL + AniList
│   └── Dockerfile
├── database/mysql/init.sql
├── scripts/smoke-test.mjs
├── legacy/                Arquivos Expo originais para consulta
├── docker-compose.yml
├── .env.example
└── README.md
```

## API principal

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Conta/sessão |
| GET, PATCH, DELETE | `/api/me` | Autenticado |
| GET, PUT, DELETE | `/api/library` | Autenticado |
| DELETE | `/api/library/:id`, `/api/favorites` | Autenticado |
| GET, POST, DELETE | `/api/history` | Autenticado |
| DELETE | `/api/history/:id` | Autenticado |
| GET, POST | `/api/episodes/:id`, `/api/episodes` | Autenticado |
| GET | `/api/media`, `/api/media/:id` | Público ou 18+ autenticado |
| GET | `/api/characters/:id`, `/api/character/:id` | Catálogo/Personagens |
| GET | `/api/avatars` | Autenticado |
| GET | `/api/airing`, `/api/health` | Público |

## Teste rápido

Depois que o `docker compose ps` mostrar os serviços ativos:

```powershell
node .\scripts\smoke-test.mjs
```

Este teste cria uma conta **temporária**, exercita autenticação, perfil, biblioteca, histórico e progresso, e depois exclui essa conta temporária (não altera contas existentes).
