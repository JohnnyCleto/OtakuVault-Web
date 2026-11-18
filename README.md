# ✦ OtakuVault — Plataforma Web Full Stack de Animes, Mangás e Light Novels

**Meu projeto de catálogo, biblioteca pessoal e comunidade para fãs de anime, mangá e light novels.**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-8b5cf6)
![React](https://img.shields.io/badge/React-18-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-22-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479a1)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)

> **Resumo:** desenvolvi o OtakuVault para reunir descoberta de obras, organização da minha biblioteca, acompanhamento de episódios e capítulos, avaliações e interação entre usuários em uma única aplicação. O projeto começou no **React Native/Expo** e evoluiu para uma arquitetura **Web Full Stack**, utilizando **React, Node.js, MongoDB, MySQL e Docker**.

**Estado atual:** implementação funcional no código, em fase de testes e aprimoramentos. O projeto ainda não foi validado como serviço público pronto para produção.

---

## 📚 Sumário

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Objetivos e diferenciais](#-objetivos-e-diferenciais)
3. [Funcionalidades implementadas](#-funcionalidades-implementadas)
4. [Design e experiência de uso](#-design-e-experiência-de-uso)
5. [Tecnologias utilizadas](#-tecnologias-utilizadas)
6. [Arquitetura do sistema](#-arquitetura-do-sistema)
7. [Organização das pastas](#-organização-das-pastas)
8. [Bancos de dados e persistência](#-bancos-de-dados-e-persistência)
9. [Instalação e execução com Docker](#-instalação-e-execução-com-docker)
10. [Cadastro e verificação de e-mail](#-cadastro-e-verificação-de-e-mail)
11. [Configuração para envio real de e-mails](#-configuração-para-envio-real-de-e-mails)
12. [Rotas da aplicação](#-rotas-da-aplicação)
13. [API REST](#-api-rest)
14. [Testes e diagnóstico](#-testes-e-diagnóstico)
15. [Segurança e privacidade](#-segurança-e-privacidade)
16. [Limitações atuais](#-limitações-atuais)
17. [Próximas melhorias](#-próximas-melhorias)
18. [Evolução do projeto e créditos](#-evolução-do-projeto-e-créditos)

---

## 🎯 Sobre o projeto

O **OtakuVault** nasceu da ideia de criar um lugar onde eu pudesse **descobrir, organizar, acompanhar e avaliar** as histórias de que gosto, sem precisar depender de diferentes aplicativos para cada tarefa.

Comecei com um protótipo em **Expo e React Native**, no qual desenvolvi páginas de catálogo, busca, detalhes, favoritos, histórico, perfil e uma área de conteúdo adulto separada. Depois decidi transformar essa experiência em uma plataforma web com backend próprio, bancos de dados persistentes e recursos sociais.

Nesta versão, o OtakuVault deixou de ser apenas um catálogo e passou a reunir três partes principais:

- **Descoberta de conteúdo:** animes, mangás, light novels, personagens, novidades, tendências, rankings e informações de obras.
- **Organização pessoal:** listas, favoritos, progresso, histórico, preferências, avaliações e perfil personalizável.
- **Comunidade:** reviews, seguidores, perfis públicos, feed de atividades, busca de pessoas e fórum de discussão.

Para os dados das obras, utilizo a **API GraphQL da AniList**. As contas do OtakuVault, as reviews, as relações de seguidores e o conteúdo do fórum pertencem à **minha própria aplicação**; não são publicados nem sincronizados automaticamente com as contas do AniList.

O design é próprio e foi desenvolvido com referências em plataformas de organização de anime, incluindo elementos de navegação e apresentação de dados semelhantes aos que gosto no AniList. O OtakuVault **não é um produto oficial ou afiliado à AniList**.

## ✨ Objetivos e diferenciais

Ao desenvolver o projeto, procurei aplicar conceitos de Engenharia de Software que vão além de uma interface visual:

- Transformar um protótipo mobile em uma aplicação web modular e responsiva.
- Centralizar regras de negócio no backend, em vez de confiar apenas em validações do navegador.
- Usar **MongoDB** para contas e configurações flexíveis e **MySQL** para os relacionamentos e registros estruturados.
- Manter os dados do usuário persistentes entre sessões e dispositivos.
- Integrar uma API externa sem expor regras internas de autenticação.
- Criar uma comunidade onde amigos possam encontrar e acompanhar as atividades uns dos outros, respeitando preferências de privacidade.
- Permitir cadastro com confirmação de propriedade do endereço de e-mail.
- Containerizar os serviços para facilitar a configuração do ambiente de desenvolvimento.
- Separar recursos já disponíveis de integrações futuras, especialmente reprodução de mídia e notificações.

---

## 🚀 Funcionalidades implementadas

### 🏠 Página inicial e descoberta

A página inicial foi criada como uma vitrine dinâmica de conteúdo. Ela apresenta:

- **Carrossel Hero** com destaques e reprodução automática opcional.
- Seções de animes em alta, mais bem avaliados e recém-adicionados.
- Mangás populares e destaques de light novels.
- Sugestões para continuar acompanhando obras salvas.
- Filtros rápidos por gênero e navegação para listas específicas.
- Próximas exibições e novidades de episódios quando a AniList fornece essas informações.

### 🔎 Busca e catálogos

Implementei um catálogo com pesquisa e filtros para explorar títulos com mais facilidade:

- Pesquisa por nome.
- Navegação entre **animes**, **mangás** e **light novels**.
- Filtros por gênero, formato e ano, de acordo com os dados disponíveis na API.
- Ordenação por critérios como popularidade, tendências e avaliação.
- Paginação e carregamento de mais resultados.
- Categorias, seções temáticas e listas de rankings.

**Light novels** têm uma aba própria (`/light-novels`). Na AniList, essas obras são representadas pelo tipo `MANGA` com formato `NOVEL`; por isso, utilizei essa classificação na integração, preservando a identificação do formato na biblioteca.

### 📖 Página completa de cada obra

Cada anime, mangá ou light novel possui uma página com informações detalhadas, incluindo, quando fornecidas pela fonte:

- Banner, capa, título e sinopse.
- Formato, status, episódios ou capítulos, ano, gêneros e tags.
- Nota, popularidade, rankings e estatísticas.
- Relação de personagens e informações de equipe.
- Abas de **visão geral, personagens, equipe, reviews, estatísticas e fontes**.
- Distribuições de notas e status, além de dados de atividade disponibilizados pela AniList.
- Ações para favoritar, escolher o status da obra e registrar progresso.
- Trailer incorporado quando disponível e links para fontes oficiais de streaming ou leitura.

Os painéis estatísticos da obra dependem dos dados devolvidos pela AniList; títulos diferentes podem ter níveis diferentes de informação.

### ❤️ Biblioteca, favoritos e acompanhamento

Criei uma biblioteca pessoal persistida no **MySQL**, associada à conta autenticada. Nela posso:

- Adicionar e remover títulos.
- Marcar ou desmarcar favoritos.
- Selecionar o status de acompanhamento: **planejo acompanhar, em andamento, concluído, abandonado ou não recomendado**.
- Atualizar a quantidade de episódios assistidos ou capítulos lidos.
- Utilizar controles de progresso e registrar eventos de acompanhamento.
- Filtrar a lista e visualizar capas, títulos, progresso e informações básicas salvas no banco.
- Limpar os favoritos ou a biblioteca nas configurações, mediante confirmação.

Também criei **snapshots** com dados básicos das obras para evitar depender exclusivamente de um cache temporário no navegador. Assim, os nomes e as capas dos títulos acompanhados podem continuar disponíveis depois de atualizar a página.

### 🕘 Histórico e novidades

O aplicativo registra, quando essa preferência está ativada, os títulos abertos pelo usuário. O histórico possui data de acesso e opções para excluir um registro ou limpar tudo.

A área de novidades utiliza dados da AniList para mostrar os próximos episódios de animes. O **sininho de notificações** destaca atualizações relacionadas aos títulos acompanhados.

> Atualmente, as notificações são **consultadas dentro do aplicativo**; não se trata de notificações push enviadas ao celular ou ao navegador.

### 👥 Personagens e equipe

Implementei páginas para visualizar personagens vinculados às obras, suas imagens, descrições, papéis na história e, quando disponíveis, informações sobre dubladores japoneses.

### ⭐ Reviews e avaliações

Uma parte importante da evolução do OtakuVault foi criar um sistema próprio de avaliações. Usuários autenticados podem:

- Escrever **uma review por título**, com título, texto e nota.
- Atribuir nota na escala de **1 a 100**, apresentada na interface em uma escala equivalente sobre 10.
- Editar ou excluir a própria avaliação.
- Identificar uma avaliação como contendo **spoilers**, permitindo ocultar seu conteúdo até a pessoa optar por visualizá-lo.
- Consultar as avaliações de um anime, mangá ou light novel.
- Ver reviews recentes na área da comunidade e nos perfis públicos, respeitando as regras de visibilidade.

Essas reviews são armazenadas no OtakuVault. Elas **não alteram as notas nem as reviews do AniList**.

### 🧑‍🤝‍🧑 Comunidade, seguidores e feed

Quis que o projeto permitisse interação entre amigos, e não apenas organização individual. Por isso, incluí:

- Busca por contas com perfil público.
- **Seguir e deixar de seguir** outros usuários do OtakuVault.
- Listas de seguidores e de pessoas seguidas.
- **Perfis públicos compartilháveis** por link (`/usuarios/:id`).
- Avatar, nome, biografia, estatísticas, biblioteca e avaliações no perfil, de acordo com a privacidade escolhida.
- **Feed de atividades** de pessoas seguidas, incluindo publicações e atualizações elegíveis.
- Controles para tornar o perfil privado e ocultar separadamente a biblioteca ou a atividade.

O endereço de e-mail da conta não é exposto na página pública. Conteúdo classificado como adulto também é excluído das áreas públicas de biblioteca e feed.

### 💬 Fórum

Incluí um fórum básico para discussões entre usuários. Nele é possível:

- Visualizar e criar tópicos.
- Organizar assuntos nas categorias **Geral, Animes, Mangás, Novels e Recomendações**.
- Abrir discussões e publicar respostas.
- Editar ou excluir os próprios tópicos e excluir as próprias respostas, conforme as permissões implementadas.

O fórum é um módulo inicial de comunidade; ainda não inclui um painel completo de moderação, denúncias, anexos ou menções.

### 🏆 Rankings e estatísticas

Criei uma área de rankings com opções para comparar obras por popularidade, notas e tendências. Também existem painéis de estatísticas nas páginas de detalhes e nos perfis, usando informações disponíveis na AniList e registros do OtakuVault, conforme cada seção.

### 👤 Perfil e configurações

Cada conta tem recursos de personalização:

- Nome e biografia editáveis.
- Avatar escolhido a partir de personagens pesquisáveis.
- Estatísticas e informações da própria biblioteca.
- Configuração do carrossel automático.
- Indicador de novidades e opção para registrar histórico.
- Preferências de privacidade social.
- Ativação opcional do catálogo adulto e desfoque das capas.
- Limpeza de favoritos, biblioteca e histórico.
- Logout e **exclusão da conta mediante confirmação de senha**.

### 🔞 Área de conteúdo adulto

A área 18+ fica **desativada por padrão** e separada do catálogo geral. Sua ativação depende de uma conta autenticada e de uma confirmação declaratória de maioridade. O backend também verifica o acesso aos títulos restritos.

Adicionei uma opção para manter capas adultas desfocadas. Esse conteúdo não é exibido nos perfis e feeds públicos.

**Importante:** confirmar que se tem 18 anos é uma declaração do usuário; **não equivale a um serviço de verificação documental ou legal de idade**.

### ▶️ Trailers e fontes de mídia

Preparei uma experiência de consulta a fontes de reprodução e leitura:

- Incorporação de trailers do YouTube quando houver um trailer compatível.
- Exibição de links externos para fontes oficiais cadastradas na AniList.
- Componente de visualização de fontes (`WatchSheet`).

**O OtakuVault não hospeda animes completos, arquivos de mangá nem capítulos de light novels**, e não oferece acesso não autorizado a conteúdo protegido. Um player de episódios completos ou leitor integrado dependeria de autorização e de APIs de provedores licenciados.

---

## 🎨 Design e experiência de uso

Mantive a identidade visual do aplicativo original e adaptei a navegação ao uso em computadores e dispositivos móveis.

**Elementos principais do design:**

- Tema escuro com superfícies em tons de roxo e detalhes em rosa.
- Barra lateral no desktop, cabeçalho com busca, avatar e notificações.
- Navegação inferior adaptada ao celular.
- Cartões com capas, notas, estados e informações de acompanhamento.
- Carrossel, filtros em chips, rankings em linhas, abas horizontais e painéis estatísticos.
- Telas de carregamento, erro e estados vazios.

Cores de referência da interface:

| Elemento | Cor |
|---|---|
| Fundo principal | `#15131f` |
| Superfícies e cartões | `#221f33` |
| Cor de destaque | `#ff4f8b` |
| Texto principal | `#f2eff8` |

A interface foi pensada para facilitar o acompanhamento de muitas obras sem transformar todas as páginas em uma lista simples de capas.

---

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologias | Responsabilidade |
|---|---|---|
| Frontend | **React 18, TypeScript, Vite 6** | Interface e construção da aplicação web |
| Roteamento | **React Router 7** | Páginas e navegação sem recarregar o site |
| Ícones | **Lucide React** | Elementos visuais da interface |
| Backend | **Node.js 22, Express 4, TypeScript** | API REST e regras de negócio |
| Validação | **Zod** | Validação de dados de entrada |
| Autenticação | **Argon2, JWT, cookie-parser** | Hash de senhas e sessões |
| Segurança HTTP | **Helmet, express-rate-limit** | Cabeçalhos de proteção e controle básico de requisições |
| Banco não relacional | **MongoDB 7 + Mongoose** | Contas, tokens e preferências |
| Banco relacional | **MySQL 8.4 + mysql2** | Biblioteca, reviews, seguidores, histórico e fórum |
| E-mail | **Nodemailer + SMTP** | Confirmação de conta e redefinição de senha |
| E-mail de desenvolvimento | **Mailpit** | Captura local de mensagens para testes |
| Catálogo externo | **AniList GraphQL API** | Dados das obras, personagens e programação |
| Infraestrutura | **Docker Compose + Nginx** | Containers, proxy de API e arquivos estáticos |

## 🧩 Arquitetura do sistema

```text
                       NAVEGADOR DO USUÁRIO
                                │
                                ▼
                     http://localhost:5173
                                │
                 ┌──────────────┴──────────────┐
                 │   FRONTEND REACT + VITE     │
                 │  Build servido pelo Nginx   │
                 └──────────────┬──────────────┘
                                │ /api/*
                                ▼
                 ┌─────────────────────────────┐
                 │      NODE.JS + EXPRESS      │
                 │ Autenticação e API REST      │
                 │ Validação e regras de acesso │
                 └────┬─────────┬──────────┬───┘
                      │         │          │
             ┌────────▼──┐ ┌────▼─────┐ ┌──▼──────────────┐
             │ MongoDB   │ │  MySQL   │ │ Integrações      │
             │ Usuários  │ │ Biblioteca│ │ AniList GraphQL  │
             │ Tokens    │ │ Reviews   │ │ SMTP / Mailpit   │
             │ Sessões*  │ │ Social    │ └─────────────────┘
             │ Preferênc.│ │ Fórum     │
             └───────────┘ └──────────┘

* As sessões são verificadas por JWT em cookie e pela versão da
  sessão armazenada no registro do usuário no MongoDB.
```

O frontend acessa a API através do caminho `/api`. O Nginx encaminha as requisições para o container `backend`, enquanto os bancos ficam na rede interna definida pelo Docker Compose.

O identificador do usuário criado no MongoDB também é utilizado nos registros do MySQL. Como bancos diferentes não compartilham chaves estrangeiras automaticamente, a aplicação controla essa associação no backend.

## 📂 Organização das pastas

```text
OtakuVault-Web/
├── backend/
│   ├── src/
│   │   ├── server.ts             # API, autenticação, integrações e rotas
│   │   └── mailer.ts             # Envio SMTP e templates de e-mail
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # HeroCarousel, MediaCard, Reviews,
│   │   │                        # WatchSheet, StatusPicker, ProgressStepper...
│   │   ├── contexts/            # Autenticação, biblioteca e configurações
│   │   ├── hooks/               # Hooks de consulta ao catálogo
│   │   ├── pages/               # Páginas do catálogo, perfis, fórum,
│   │   │                        # reviews, login e configurações
│   │   ├── services/            # Comunicação HTTP com o backend
│   │   ├── types/               # Tipos TypeScript
│   │   ├── App.tsx               # Layout e rotas
│   │   ├── main.tsx              # Entrada React e providers
│   │   └── style.css            # Tema e estilos responsivos
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── package.json
│
├── database/
│   └── mysql/
│       └── init.sql             # Criação inicial das tabelas
│
├── scripts/
│   ├── smoke-test.mjs           # Testes básicos da aplicação
│   ├── smoke-test-social.mjs    # Testes de comunidade e fórum
│   ├── smoke-test-email.mjs     # Testes de verificação e senha
│   └── mailpit-test-helper.mjs
│
├── legacy/                      # Referências do projeto Expo original
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── README-EMAIL.md
├── README-SOCIAL.md
├── README-MIGRACAO.md
└── README-CORRECAO-502.md
```

---

## 🗄️ Bancos de dados e persistência

Utilizei dois bancos com responsabilidades diferentes.

### MongoDB — contas e informações flexíveis

As coleções principais incluem:

- **`users`**: nome, e-mail, hash de senha, e-mail verificado, versão da sessão, avatar, biografia, preferências, opção de conteúdo adulto e configurações de privacidade.
- **`authtokens`** (modelo `AuthToken`): hashes dos tokens temporários de verificação de e-mail e recuperação de senha, com expiração e índice TTL.

O MongoDB é a origem dos dados de autenticação; senhas não são armazenadas em texto puro.

### MySQL — relações e atividades

| Tabela | Finalidade |
|---|---|
| `library_entries` | Obras salvas, status, favorito e progresso |
| `user_media_snapshots` | Nome, capa e metadados básicos das obras salvas |
| `history_entries` | Histórico de títulos abertos |
| `episode_events` | Eventos de progresso de episódios/capítulos |
| `reviews` | Texto, nota, spoiler e autor das avaliações |
| `follows` | Relação entre quem segue e quem é seguido |
| `activity_events` | Atividades elegíveis para o feed social |
| `forum_threads` | Tópicos de discussão |
| `forum_replies` | Respostas aos tópicos |

O arquivo `database/mysql/init.sql` prepara as tabelas para uma instalação nova. O backend também contém uma rotina de inicialização para criar ou ampliar tabelas necessárias em volumes já existentes.

> **Observação técnica:** algumas tabelas herdadas utilizam `user_id + media_id` como identificador de obra. Como IDs de anime e mangá podem pertencer a espaços diferentes na AniList, pretendo aprimorar essa chave para incluir também o tipo da mídia em uma migração futura.

---

## 🐳 Instalação e execução com Docker

### Pré-requisitos

- **Docker Desktop** com Docker Compose disponível.
- Windows com **PowerShell**, ou outro sistema compatível com Docker.
- Acesso à internet para baixar as imagens e dependências na primeira construção.
- Portas locais **5173** e **8025** disponíveis.
- Para rodar os scripts de teste fora do container: **Node.js 22 ou compatível**.

### 1. Obter o código

Clone o repositório onde o projeto estiver publicado ou extraia o arquivo ZIP do OtakuVault Web e abra a pasta que contém `docker-compose.yml`.

### 2. Criar as variáveis de ambiente

No **PowerShell**:

```powershell
Copy-Item .env.example .env
notepad .env
```

No Linux/macOS, o equivalente é `cp .env.example .env`.

O `.env.example` inclui variáveis como:

```dotenv
# Valores de demonstração. Substitua as senhas antes de iniciar.
MYSQL_ROOT_PASSWORD=troque_esta_senha_root
MYSQL_DATABASE=otakuvault
MYSQL_USER=otaku
MYSQL_PASSWORD=troque_esta_senha_mysql

MONGO_INITDB_ROOT_USERNAME=otaku
MONGO_INITDB_ROOT_PASSWORD=troque_esta_senha_mongo

JWT_SECRET=substitua_este_valor_por_um_segredo_aleatorio_com_32_ou_mais_caracteres
PORT=3001

APP_ENV=development
APP_PUBLIC_URL=http://localhost:5173
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_REQUIRE_TLS=false
SMTP_FROM="OtakuVault <nao-responda@otakuvault.local>"
COOKIE_SECURE=false
```

**Nunca publique o arquivo `.env`** ou compartilhe suas senhas de banco, o `JWT_SECRET` ou as credenciais SMTP. O `.gitignore` foi configurado para ignorar esses arquivos.

### 3. Construir e iniciar os serviços

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Após os serviços ficarem disponíveis:

| Endereço | Serviço |
|---|---|
| <http://localhost:5173> | OtakuVault Web |
| <http://localhost:5173/api/health> | Verificação de saúde da API |
| <http://localhost:8025> | Mailpit — caixa de e-mails de desenvolvimento |

O backend utiliza a porta **3001 dentro da rede Docker**; o acesso do navegador acontece pelo proxy `/api` do Nginx.

### 4. Consultar logs

```powershell
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 mongo
docker compose logs --tail=100 mysql
```

Para acompanhar o backend em tempo real:

```powershell
docker compose logs -f backend
```

### 5. Parar sem perder os dados

```powershell
docker compose down
```

**Atenção:** não execute `docker compose down -v` para uma atualização comum. A opção `-v` remove volumes persistentes e pode apagar as contas, avaliações e bibliotecas armazenadas.

### Atualização de uma versão anterior

1. Faça backup da pasta do projeto e dos dados importantes.
2. Preserve as credenciais do `.env` já utilizadas para inicializar os bancos.
3. Substitua os arquivos de código pelos da versão nova.
4. Acrescente ao `.env` as variáveis SMTP que ainda não estiverem presentes.
5. Execute `docker compose up --build -d`.
6. Verifique os logs e execute os testes locais.

**Alterar senhas no `.env` não muda automaticamente as credenciais de bancos de dados que já foram inicializados em volumes existentes.**

---

## ✉️ Cadastro e verificação de e-mail

Para que a conta tenha um e-mail controlado pelo usuário, acrescentei um fluxo de ativação antes do primeiro login.

### Como funciona o cadastro

1. O usuário informa **nome, e-mail e senha**.
2. O backend valida os dados, utiliza **Argon2** para gerar o hash da senha e cria uma conta pendente no MongoDB.
3. Um e-mail é enviado com um **link único de verificação**.
4. O usuário abre o link e confirma a posse daquele endereço.
5. A conta passa a ter o e-mail verificado e fica apta a fazer login.

O login de uma conta ainda não verificada é recusado até a confirmação.

### Recursos de autenticação

- **Verificação de e-mail:** token aleatório de uso único com validade de **24 horas**.
- **Reenvio do link:** disponível para contas pendentes, com limites de frequência.
- **Esqueci minha senha:** solicitação de link de recuperação.
- **Redefinição de senha:** link de uso único válido por **30 minutos**.
- **Invalidação de sessões antigas:** a redefinição incrementa a versão da sessão, invalidando cookies anteriores.
- **Respostas genéricas:** nos pedidos de recuperação e reenvio, para dificultar a identificação de contas existentes.
- **Proteção dos tokens:** apenas o hash SHA-256 é persistido no banco, e os registros possuem expiração.

### Testando com Mailpit

No ambiente Docker local, o Mailpit recebe os e-mails de desenvolvimento. Crie uma conta na aplicação e abra <http://localhost:8025> para visualizar a mensagem e confirmar o cadastro.

O **Mailpit não entrega e-mails reais para Gmail, Outlook ou outros provedores**. Ele serve para testar o fluxo com segurança antes de configurar um serviço SMTP externo.

### Contas criadas em versões antigas

Usuários cadastrados antes dessa atualização podem precisar **confirmar o e-mail originalmente registrado**. O procedimento preserva o identificador da conta, de modo que as listas, reviews, seguidores e histórico continuem associados ao mesmo usuário.

---

## 🌐 Configuração para envio real de e-mails

Para publicar o sistema e enviar mensagens para caixas de e-mail reais, preciso contratar ou configurar um provedor SMTP autorizado e utilizar um domínio adequado.

Exemplo ilustrativo de configuração para produção:

```dotenv
APP_ENV=production
APP_PUBLIC_URL=https://seu-dominio.com
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=usuario_smtp
SMTP_PASS=senha_ou_token_smtp
SMTP_FROM="OtakuVault <contato@seu-dominio.com>"
COOKIE_SECURE=true
```

As credenciais acima são **placeholders**, não dados reais.

Para a entrega de e-mails funcionar bem, também é necessário configurar os registros **SPF, DKIM e DMARC** do domínio de envio, conforme as orientações do provedor.

> O `docker-compose.yml` atual é voltado para **desenvolvimento local**. Uma instalação pública precisa de HTTPS, política de segredos, configuração de domínio, backups, proteção adicional contra abuso e Mailpit fora da exposição pública.

---

## 🧭 Rotas da aplicação

### Conteúdo e catálogo

| Página | Rota |
|---|---|
| Início | `/` |
| Busca avançada | `/busca` |
| Mangás | `/mangas` |
| Light novels | `/light-novels` |
| Categorias | `/categorias` |
| Seções do catálogo | `/secao/:tipo` |
| Rankings | `/rankings` |
| Detalhes da obra | `/titulo/:id` |
| Personagens da obra | `/personagens/:id` |
| Página do personagem | `/personagem/:id` |
| Novidades | `/novidades` |
| Notificações no app | `/notificacoes` |
| Catálogo adulto | `/adulto` |

### Conta e biblioteca

| Página | Rota |
|---|---|
| Login e cadastro | `/login` |
| Verificar e-mail | `/verificar-email` |
| Reenviar verificação | `/reenviar-verificacao` |
| Esqueci minha senha | `/esqueci-senha` |
| Redefinir senha | `/redefinir-senha` |
| Meu perfil | `/perfil` |
| Editar perfil | `/editar-perfil` |
| Escolher avatar | `/escolher-avatar` |
| Minha lista | `/minha-lista` |
| Favoritos | `/favoritos` |
| Histórico | `/historico` |
| Configurações | `/configuracoes` |

### Comunidade e informações

| Página | Rota |
|---|---|
| Comunidade | `/comunidade` |
| Perfil público | `/usuarios/:id` |
| Fórum | `/forum` |
| Tópico do fórum | `/forum/:id` |
| Ajuda | `/ajuda` |
| Sobre | `/sobre` |

---

## 🔌 API REST

Todas as rotas abaixo utilizam o prefixo `/api`. As operações que alteram dados pessoais exigem autenticação, conforme o middleware do backend.

### Autenticação e conta

| Método | Endpoint | Função |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro pendente |
| `POST` | `/api/auth/verify-email` | Confirmação por token |
| `POST` | `/api/auth/resend-verification` | Reenvio de confirmação |
| `POST` | `/api/auth/login` | Autenticação |
| `POST` | `/api/auth/logout` | Encerrar sessão |
| `POST` | `/api/auth/forgot-password` | Solicitar recuperação |
| `POST` | `/api/auth/reset-password` | Definir nova senha |
| `GET` | `/api/me` | Dados da própria conta |
| `PATCH` | `/api/me` | Editar perfil e preferências |
| `DELETE` | `/api/me` | Excluir a própria conta |

### Biblioteca, histórico e catálogo

| Método | Endpoint | Função |
|---|---|---|
| `GET`, `PUT` | `/api/library` | Listar ou salvar obras |
| `DELETE` | `/api/library` | Limpar biblioteca |
| `DELETE` | `/api/library/:id` | Remover obra |
| `DELETE` | `/api/favorites` | Limpar favoritos |
| `GET`, `POST`, `DELETE` | `/api/history` | Consultar, registrar ou limpar histórico |
| `DELETE` | `/api/history/:id` | Remover registro |
| `POST` | `/api/episodes` | Registrar progresso |
| `GET` | `/api/episodes/:id` | Consultar registros de progresso |
| `GET` | `/api/media` | Buscar títulos na AniList |
| `GET` | `/api/media/:id` | Detalhes de título |
| `GET` | `/api/characters/:id` | Personagens da obra |
| `GET` | `/api/character/:id` | Dados de um personagem |
| `GET` | `/api/avatars` | Encontrar opções de avatar |
| `GET` | `/api/airing` | Programação de episódios |

### Comunidade, reviews e fórum

| Método | Endpoint | Função |
|---|---|---|
| `GET` | `/api/social/users` | Buscar perfis públicos |
| `GET` | `/api/social/reviews` | Reviews recentes |
| `GET` | `/api/users/:id` | Perfil público |
| `GET` | `/api/users/:id/library` | Biblioteca pública, quando permitida |
| `GET` | `/api/users/:id/reviews` | Reviews públicas |
| `GET` | `/api/users/:id/activity` | Atividade pública |
| `GET` | `/api/users/:id/followers` | Seguidores |
| `GET` | `/api/users/:id/following` | Seguindo |
| `POST`, `DELETE` | `/api/users/:id/follow` | Seguir ou deixar de seguir |
| `GET` | `/api/feed` | Feed de contas seguidas |
| `GET` | `/api/reviews/media/:id` | Reviews de uma obra |
| `PUT` | `/api/reviews` | Criar/editar review |
| `DELETE` | `/api/reviews/:id` | Excluir review própria |
| `GET`, `POST` | `/api/forum` | Listar e criar tópicos |
| `GET`, `PUT`, `DELETE` | `/api/forum/:id` | Consultar, editar e excluir tópico |
| `POST` | `/api/forum/:id/replies` | Responder tópico |
| `DELETE` | `/api/forum/replies/:id` | Excluir a própria resposta |
| `GET` | `/api/health` | Verificação de saúde |

As respostas podem variar de acordo com a autenticação, permissões, filtros enviados e disponibilidade da AniList.

---

## 🧪 Testes e diagnóstico

Com os containers iniciados e o Mailpit acessível, o projeto inclui scripts de verificação:

```powershell
node .\scripts\smoke-test-email.mjs
node .\scripts\smoke-test.mjs
node .\scripts\smoke-test-social.mjs
```

**O que esses scripts exercitam:**

- **E-mail:** cadastro pendente, bloqueio antes da verificação, confirmação, consumo único do link, recuperação e redefinição de senha.
- **Aplicação:** login, perfil, biblioteca, histórico, eventos de progresso e operações da conta.
- **Social:** criação de contas de teste, busca de usuários, seguidores, privacidade, criação de tópico e respostas no fórum.

Eles criam contas temporárias e tentam removê-las ao finalizar. **Devem ser executados somente em um ambiente de desenvolvimento**, nunca contra contas de usuários reais.

### Como verificar se a API está respondendo

```powershell
Invoke-RestMethod http://localhost:5173/api/health
```

Resposta esperada quando o servidor está saudável:

```json
{"ok":true}
```

### Erros comuns

| Sintoma | O que verificar |
|---|---|
| `502 Bad Gateway` em várias rotas | Backend parado, reiniciando ou inacessível pelo Nginx; veja `docker compose logs backend` |
| `401 Unauthorized` em `/api/me` | Ausência de sessão autenticada; é esperado para visitantes |
| `EMAIL_NOT_VERIFIED` | Conta ainda não confirmada; abra o link ou peça reenvio |
| E-mail não aparece | SMTP/Mailpit, `SMTP_HOST`, `SMTP_PORT` e logs do backend |
| MySQL nega acesso | Credenciais usadas originalmente ao criar o volume |
| MongoDB nega acesso | Usuário/senha e URI de conexão do volume existente |
| Falha no catálogo | Rede, disponibilidade, parâmetros ou limite de requisições da AniList |
| `npm run build` falha | Verifique os erros do TypeScript antes de reiniciar os containers |

Na última revisão do projeto, corrigi um caso em que a **ausência de configuração SMTP interrompia a inicialização do backend** e provocava `502` em todas as rotas. A configuração do e-mail agora é validada quando utilizada, e o Compose inclui uma checagem de saúde do backend. Isso não elimina outras possíveis causas de erro 502.

**Validação conhecida:** o código e os arquivos foram submetidos a verificações estáticas durante o desenvolvimento, mas **não há confirmação, neste README, de que a compilação Docker e todos os testes de ponta a ponta passaram em todos os ambientes**. Recomendo executar os testes acima antes de publicar ou demonstrar a aplicação.

---

## 🔐 Segurança e privacidade

Desde a migração para Full Stack, passei a tratar autenticação e proteção de dados como partes centrais da arquitetura.

### Proteções presentes no código

- Hash de senhas com **Argon2**.
- Sessão por **JWT em cookie HttpOnly**, configurado com `SameSite=Strict`.
- Opção `COOKIE_SECURE=true` para cookies enviados apenas por HTTPS em produção.
- Verificação da conta no MongoDB e da versão da sessão nas rotas protegidas.
- Tokens temporários de verificação e recuperação armazenados apenas na forma de **hash**.
- Validação de entrada com **Zod**.
- Cabeçalhos de segurança com **Helmet**.
- Limitação de requisições em endpoints sensíveis.
- Controles de visibilidade do perfil, biblioteca e atividade.
- Separação de conteúdo adulto das áreas sociais públicas.
- `.env` fora do versionamento.

### Cuidados ainda necessários antes de uma publicação pública

- HTTPS e configuração segura de domínio e cookies.
- Proteção completa contra CSRF e revisão de políticas de origem.
- Sistema de denúncia, bloqueio e moderação da comunidade.
- Política de privacidade, exclusão e retenção de dados.
- Backups, observabilidade e migrações versionadas.
- Estratégias adicionais de prevenção de spam, abuso e tentativas automatizadas.
- Verificação das exigências legais aplicáveis ao conteúdo 18+.
- Testes automatizados de integração e interface em uma pipeline de CI.

A confirmação de e-mail comprova **acesso ao endereço informado**, não identidade civil nem idade.

---

## ⚠️ Limitações atuais

Procuro documentar claramente a diferença entre o que já desenvolvi e o que ainda depende de outras integrações:

| Recurso | Situação atual |
|---|---|
| Catálogo, busca, perfis, listas, reviews, seguidores e fórum | Implementados no código |
| Verificação de e-mail e recuperação de senha | Implementadas; envio real depende de SMTP configurado |
| Dados de obras e estatísticas | Dependem da disponibilidade e dos campos da AniList |
| Notificações de episódios | Consultadas no aplicativo; sem push notifications |
| Trailers | Reprodução incorporada quando disponível |
| Episódios completos e leitura integral | Não integrados; exigem fontes licenciadas |
| Área 18+ | Separada, com confirmação declaratória de idade |
| Sincronização com uma conta AniList | Não implementada |
| Moderação avançada e sistema de denúncias | Ainda não implementados |
| Implantação pública em produção | Requer configuração e testes adicionais |

Além disso, alguns registros de obras antigas podem precisar ter seus metadados básicos atualizados ao serem salvos novamente. A plataforma também depende de acesso à AniList para recuperar novas informações de títulos.

---

## 🗺️ Próximas melhorias

Quero continuar evoluindo o OtakuVault com foco em qualidade, manutenção e recursos de comunidade. Entre as melhorias planejadas estão:

1. **Moderação social:** denúncias, bloqueio de usuários, moderação de reviews e fórum, regras de comunidade e ferramentas administrativas.
2. **Notificações:** avisos de seguidores, comentários e respostas; futuramente, notificações push com consentimento.
3. **Interação social:** comentários em reviews, curtidas, recomendações personalizadas e atividades mais detalhadas.
4. **Biblioteca:** migração para chaves que diferenciem explicitamente anime, mangá e novel, além de filtros e estatísticas mais completas.
5. **Experiência visual:** refinamento de acessibilidade, navegação por teclado, responsividade e novos componentes de análise.
6. **Integrações autorizadas:** estudar APIs oficiais para reprodução ou leitura dentro do site quando houver permissão de uso.
7. **Infraestrutura:** testes automatizados em CI, migrações versionadas, backups, monitoramento e implantação segura em domínio próprio.
8. **Qualidade do código:** dividir progressivamente o backend em módulos de rotas, serviços, modelos e controladores para facilitar manutenção e testes.
9. **Contas:** fluxo seguro para alteração do endereço de e-mail cadastrado, com revalidação.

Esses itens são **planos futuros**, não recursos concluídos nesta versão.

---

## 📝 Evolução do projeto e créditos

### Evolução

| Etapa | Principal mudança |
|---|---|
| Protótipo Expo | Catálogo mobile, detalhes, favoritos, busca, perfil e configurações |
| Migração Web | React + Vite, API Express, MongoDB, MySQL e Docker |
| Expansão da interface | Carrossel, personagens, novidades, biblioteca enriquecida e progresso |
| Comunidade | Light novels, reviews, perfis públicos, seguidores, rankings, feed e fórum |
| Contas verificadas | E-mail de confirmação, reenvio, recuperação de senha, SMTP e Mailpit |
| Manutenção | Correções de compilação, roteamento e inicialização/saúde do backend |

### Referências e serviços utilizados

- [React](https://react.dev/) e [Vite](https://vite.dev/) — interface web.
- [Node.js](https://nodejs.org/) e [Express](https://expressjs.com/) — API.
- [MongoDB](https://www.mongodb.com/) e [MySQL](https://www.mysql.com/) — persistência.
- [Docker](https://www.docker.com/) — ambiente containerizado.
- [AniList](https://anilist.co/) — metadados de obras, personagens e programação, via API pública.
- [Nodemailer](https://nodemailer.com/) e [Mailpit](https://mailpit.axllent.org/) — envio e testes de e-mail.
- [Lucide](https://lucide.dev/) — ícones.

Os nomes, imagens, sinopses e outros metadados de obras podem pertencer a seus respectivos titulares. A utilização de links para serviços externos não significa que o OtakuVault seja afiliado a essas plataformas.

### Sobre o desenvolvimento

Este é um **projeto pessoal de desenvolvimento de software**, que utilizo para colocar em prática conhecimentos de frontend, backend, APIs, autenticação, bancos de dados, arquitetura, interface e infraestrutura.

Meu objetivo é continuar aperfeiçoando o OtakuVault como uma plataforma que eu gostaria de usar: um espaço para acompanhar minhas histórias favoritas, descobrir novas obras, escrever avaliações e compartilhar recomendações com amigos.

**✦ OtakuVault — Minha biblioteca, minhas histórias, minha comunidade.**
