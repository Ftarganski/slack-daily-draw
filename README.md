# Daily Draw

Slack app que sorteia, por semana, quem **apresenta** (🎤) e quem **conta uma curiosidade** (💡) na daily de cada dia útil (seg–sex). O sorteio é fixado por semana ISO: chamar de novo dentro da semana retorna a mesma escala.

## Stack

- **Next.js (App Router) + Edge runtime** → sem cold start (Edge não hiberna como serverless Node).
- **Upstash Redis** (REST/HTTP, edge-compatible) → roster + lock semanal.
- **Vercel** deploy.

## Comandos (slash `/daily-presenter`)

| Comando | Efeito | Visibilidade |
|---|---|---|
| `/daily-presenter` | Escala da semana, hoje em destaque (sorteia se inexistente) | canal |
| `/daily-presenter semana` | Escala completa | canal |
| `/daily-presenter add @a @b` | Cadastra pessoas | privado |
| `/daily-presenter remove @a` | Remove pessoas | privado |
| `/daily-presenter lista` | Roster atual | privado |
| `/daily-presenter reset` | Re-sorteia a semana (só `SLACK_ADMIN_IDS`) | canal |
| `/daily-presenter help` | Ajuda | privado |

## Segurança

- Verificação de assinatura HMAC SHA256 (`SLACK_SIGNING_SECRET`).
- Janela anti-replay de 5 min sobre o timestamp.
- Allowlist de workspace (`SLACK_ALLOWED_TEAM_ID`) e canal (`SLACK_ALLOWED_CHANNEL_ID`).
- Sorteio com `SET NX` atômico → sem corrida de sorteio duplo.

## Setup do Slack App

1. https://api.slack.com/apps → **Create New App** → **From an app manifest** → cole:

```yaml
display_information:
  name: Daily Draw
features:
  slash_commands:
    - command: /daily-presenter
      url: https://slack-daily-draw.vercel.app/api/slack/command
      description: Sorteio da daily da semana
      usage_hint: "[semana | add @a | remove @a | lista | reset]"
      should_escape: true
oauth_config:
  scopes:
    bot:
      - commands
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
```

> `should_escape: true` é obrigatório — sem isso o Slack não envia os IDs de usuário (`<@U…>`) e o `add`/`remove` não funciona.

2. **Install App** no workspace.
3. Em **Basic Information** copie o **Signing Secret** → `SLACK_SIGNING_SECRET`.
4. Pegue o **Team ID** (`T…`) e o **Channel ID** (`C…` do canal da daily).
5. Para admins do `reset`, pegue os **User IDs** (`U…`) → `SLACK_ADMIN_IDS` (separados por vírgula).

## Upstash

1. https://console.upstash.com → cria um **Redis** database (região mais perto, ex. us-east).
2. Copia `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.

## Deploy (Vercel)

```bash
pnpm install   # ou npm install
vercel
vercel --prod
```

Configure as env vars (Project Settings → Environment Variables) conforme `.env.example`:

```
SLACK_SIGNING_SECRET
SLACK_ALLOWED_TEAM_ID
SLACK_ALLOWED_CHANNEL_ID
SLACK_ADMIN_IDS
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
APP_TIMEZONE=America/Sao_Paulo
```

Depois do primeiro deploy, atualize a URL do slash command no manifest do Slack para o domínio de produção.

## Cold start

O Edge runtime já elimina o cold start na prática. Para garantia extra, aponte um monitor **UptimeRobot** (HTTP, intervalo 5 min) para:

```
https://slack-daily-draw.vercel.app/api/health
```

## Local

```bash
cp .env.example .env.local   # preencha
pnpm dev
```

Para testar o Slack localmente, exponha via `ngrok http 3000` e aponte o slash command para a URL do túnel.
