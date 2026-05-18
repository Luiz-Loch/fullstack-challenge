# Crash Game — Fullstack Challenge

Implementação de um **Crash Game** multiplayer em tempo real, desenvolvido como desafio fullstack da Jungle Gaming.

---

## Como subir o projeto

**Pré-requisitos:** Docker e Bun instalados.

```bash
git clone https://github.com/Luiz-Loch/fullstack-challenge
cd fullstack-challenge

# Copie os arquivos de ambiente
cp services/games/.env.example services/games/.env
cp services/wallets/.env.example services/wallets/.env

# Sobe tudo (infra + serviços + frontend)
bun docker:up
```

A aplicação estará disponível em:

| Serviço         | URL                           |
| --------------- | ----------------------------- |
| Frontend        | http://localhost:3000         |
| API Gateway     | http://localhost:8000         |
| Keycloak        | http://localhost:8080         |
| RabbitMQ UI     | http://localhost:15672        |

**Usuário de teste:** `player` / `player123`

> Ao criar uma carteira via `POST /wallets`, o saldo inicial é de **R$ 10.000,00** — suficiente para testar apostas sem precisar de nenhuma etapa adicional.

A documentação Swagger de cada serviço está disponível via Kong após o `docker:up`:

| Serviço         | Swagger UI                                  |
| --------------- | ------------------------------------------- |
| Games Service   | http://localhost:8000/games/docs            |
| Wallets Service | http://localhost:8000/wallets/docs          |

---

## Tecnologias

| Camada          | Tecnologia                                        |
| --------------- | ------------------------------------------------- |
| **Frontend**    | TanStack Start + TanStack Query + Tailwind CSS v4 |
| **Backend**     | NestJS + TypeScript (strict mode) + Bun           |
| **Banco**       | PostgreSQL (um banco por serviço)                 |
| **Mensageria**  | RabbitMQ                                          |
| **API Gateway** | Kong                                              |
| **Auth**        | Keycloak (OIDC / PKCE)                            |
| **WebSocket**   | Socket.io via `@nestjs/websockets`                |
| **Infra**       | Docker Compose                                    |

---

## Arquitetura

```
                        ┌──────────────────────────┐
                        │        Frontend           │
                        │  (TanStack + Tailwind)    │
                        └─────┬────────────┬────────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼────────┐
                        │         Kong               │
                        │      (API Gateway)         │
                        └─────┬────────────┬────────┘
                              │            │
                    ┌─────────▼──┐   ┌─────▼────────┐
                    │   Games    │   │   Wallets    │
                    │  Service   │   │   Service    │
                    │  (NestJS)  │   │   (NestJS)   │
                    └──┬─────┬──┘   └──────┬───────┘
                       │     └──────┬──────┘
                  ┌────▼────┐  ┌────▼──────────┐
                  │PostgreSQL│  │   RabbitMQ    │
                  └─────────┘  └───────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │  (IdP — OIDC)   │
              └─────────────────┘
```

A comunicação entre os serviços segue dois padrões dependendo do contexto:

- **Débito (aposta):** feito via RabbitMQ de forma **bloqueante** — o Games Service publica a solicitação de débito e aguarda a resposta do Wallets Service antes de confirmar a aposta ao jogador, garantindo feedback imediato sobre sucesso ou saldo insuficiente.
- **Crédito (liquidação):** feito de forma **assíncrona** — ao final da rodada, o Games Service publica eventos no RabbitMQ e o Wallets Service os consome para creditar os vencedores.

---

## Fluxo de uma rodada

```
1. BETTING (10s)
   ├── Scheduler gera serverSeed + clientSeed e calcula o crashPoint (provably fair)
   ├── Persiste a rodada no banco e emite evento WebSocket → round:betting
   │   (o serverSeedHash é exposto; o serverSeed fica oculto até o crash)
   └── Jogadores enviam POST /games/bet
       ├── Games Service publica bet_placed no RabbitMQ (bloqueante)
       ├── Wallets Service debita o saldo e responde
       └── Aposta confirmada → evento WebSocket → bet:placed broadcast

2. RUNNING
   ├── Scheduler emite round:started via WebSocket
   ├── Multiplier sobe continuamente: 2^(t / 10_000ms)
   │   tick a cada 100ms → evento WebSocket → multiplier:tick
   └── Jogadores enviam POST /games/bet/cashout
       ├── Bet marcada como CASHED_OUT com payout = aposta × multiplicador atual
       └── Evento WebSocket → bet:cashout broadcast

3. CRASHED
   ├── Multiplier atinge o crashPoint → scheduler interrompe o ticker
   ├── Recarrega a rodada do banco (com todas as apostas)
   ├── Apostas pendentes marcadas como LOST
   ├── Para cada aposta CASHED_OUT: emite cash_out_won no RabbitMQ (assíncrono)
   │   └── Wallets Service credita o payout ao jogador
   ├── serverSeed revelado → evento WebSocket → round:crashed
   │   (jogador pode verificar o crashPoint via GET /games/rounds/:id/verify)
   └── Aguarda 3s → volta ao passo 1
```

---

## Frontend

Aplicação SPA construída com **TanStack Start** e **Tailwind CSS v4**, com estética dark/neon de cassino.

**Principais funcionalidades:**

- Login via redirect para o Keycloak (OIDC authorization code flow + PKCE)
- Gráfico animado do multiplicador subindo em tempo real
- Controles de aposta e cash out com validações (fase correta, saldo suficiente)
- Lista ao vivo de todas as apostas e cash outs da rodada atual
- Histórico das últimas rodadas com código de cores por multiplicador
- Saldo e username do jogador exibidos via JWT

**Estado e dados:**

- **TanStack Query** para server state (rounds, histórico, saldo)
- **Socket.io client** para receber eventos do servidor em tempo real (multiplicador, cash outs, crash)
- **Zustand** para estado local de UI (fase da rodada, aposta pendente)

---

## Games Service

Serviço NestJS responsável pelo **ciclo de vida das rodadas** e comunicação em tempo real.

**Domínio:**

- `Round` — agregado principal, gerencia as fases: `BETTING → RUNNING → CRASHED`
- `Bet` — aposta de um jogador, com status `PENDING → CASHED_OUT | LOST`
- Crash point gerado via algoritmo **provably fair** (HMAC-SHA256 + hash chain), verificável pelo jogador após cada rodada

**API REST** (via Kong em `/games`):

| Método | Endpoint                  | Descrição                              |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/games/rounds/current`   | Estado atual da rodada com apostas     |
| GET    | `/games/rounds/history`   | Histórico paginado de rodadas          |
| GET    | `/games/rounds/:id/verify`| Dados para verificação provably fair   |
| GET    | `/games/bets/me`          | Histórico de apostas do jogador        |
| POST   | `/games/bet`              | Fazer aposta na rodada atual           |
| POST   | `/games/bet/cashout`      | Sacar no multiplicador atual           |

**WebSocket:** o servidor emite eventos para todos os clientes conectados — início de fase de apostas, tick do multiplicador, cash outs dos jogadores e crash da rodada.

**Mensageria:** ao receber uma aposta, publica mensagem `bet_placed` no RabbitMQ e aguarda a resposta do Wallets Service (bloqueante); ao confirmar um cash out, emite o evento `cash_out_won` de forma assíncrona para crédito.

---

## Wallets Service

Serviço NestJS responsável pela **carteira do jogador** — saldo, crédito e débito.

**Domínio:**

- `Wallet` — uma por jogador, saldo armazenado em centavos (`BIGINT`) para evitar aritmética de ponto flutuante
- Operações de débito e crédito são idempotentes via `transactionId`

**API REST** (via Kong em `/wallets`):

| Método | Endpoint       | Descrição                          |
| ------ | -------------- | ---------------------------------- |
| POST   | `/wallets`     | Cria carteira para o jogador       |
| GET    | `/wallets/me`  | Retorna carteira e saldo atual     |

**Mensageria:** consome eventos do Games Service (`bet_placed`, `cash_out_won`) e publica confirmações ou falhas de volta. Débito e crédito **não são expostos via REST** — toda movimentação financeira ocorre pelo broker.

---

## Testes

```bash
# Games Service — unitários
cd services/games && bun test tests/unit

# Wallets Service — unitários
cd services/wallets && bun test tests/unit

# Wallets Service — e2e (requer docker:up)
cd services/wallets && bun test tests/e2e
```

### Games Service — unitários

Cobre domínio, value objects e use cases do serviço:

- **Domínio** (`Round`, `Bet`): ciclo de vida das entidades, invariantes de estado e regras de negócio
- **Value objects** (`Money`, `Multiplier`): precisão monetária e operações aritméticas sem ponto flutuante
- **Provably fair**: determinismo do algoritmo, verificação da hash chain e um teste estatístico que simula 10.000 rodadas para garantir que a variação do crash point não cause prejuízo — validando que o house edge se mantém dentro da faixa esperada
- **Use cases**: place bet, cash out, verificação de rodada e históricos

### Wallets Service — unitários

Cobre domínio, value objects e use cases do serviço:

- **Domínio** (`Wallet`): criação, crédito, débito e rejeição por saldo insuficiente
- **Value object** (`Money`): precisão monetária
- **Use cases**: criação de carteira, crédito, débito e consulta de saldo

### Wallets Service — e2e

Testa os endpoints REST com a aplicação NestJS inicializada em memória, cobrindo autenticação, criação de carteira, conflitos e consulta de saldo.

---

## Estrutura do projeto

```
fullstack-challenge/
├── services/
│   ├── games/          # Game Service (NestJS)
│   │   └── src/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       └── presentation/
│   └── wallets/        # Wallet Service (NestJS)
│       └── src/
│           ├── domain/
│           ├── application/
│           ├── infrastructure/
│           └── presentation/
├── frontend/           # Frontend (TanStack Start)
├── docker/
│   ├── kong/           # Configuração das rotas do gateway
│   ├── keycloak/       # Realm exportado (importado automaticamente)
│   └── postgres/       # Script de criação dos bancos
└── docker-compose.yml
```
