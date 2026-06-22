# Chainmail

> **Status**: MVP polish / live QA · 2026-06-22  
> **Repo**: `/root/projects/chainmail`  
> **Live web**: https://chainmail.168-144-37-19.sslip.io  
> **Live API**: https://api.chainmail.168-144-37-19.sslip.io/api/health  
> **Current status doc**: [`docs/status.md`](./docs/status.md)

Encrypted second inbox for on-chain receipts. Forward crypto exchange / wallet / explorer emails into Chainmail, auto-parse them into structured receipts, and export ledger-ready CSV. Gmail stays primary.

## Current live status

Verified live with `alip3@chainmail.test`:

- Web SPA: up behind Traefik.
- API: up, DB healthy.
- Auth: sign-in, sign-up API, `/me`, route guard.
- Mailbox: inbox/sent/detail, read state, move/archive/trash actions.
- Composer: outbound queue flow, sent folder, local draft autosave.
- Parsed receipts: compact summary bar + details expansion.
- Ledger: 2026 rollup, per-asset/source/chain/month sections, CSV export.
- Labels: list/create/delete/assign endpoints.
- Aliases: list/create/delete endpoints.
- Profile: avatar/menu/modal.
- Privacy Center: modal implemented.
- UI polish: landing/auth/inbox/message detail polished, responsive breakpoints added, dark mode disabled/forced light for now.
- Parsers: 28/28 tests pass.
- Outbound relay: worker deployed, disabled until `RESEND_API_KEY` configured.

## Latest deploys

| Service | Image | Container | IP | Notes |
|---|---|---|---|---|
| Web | `chainmail:latest` | `chainmail-web-v2` | `10.0.1.88` | inbox UI overhaul: sidebar 260px, grid topbar, 0 !important, -58% CSS |
| API | `chainmail-api:w9-relay` | `chainmail-api` | `10.0.1.74` | outbound Resend relay worker |

Traefik dynamic configs:

```text
/etc/dokploy/traefik/dynamic/chainmail.yml
/etc/dokploy/traefik/dynamic/chainmail-api.yml
```

## Stack

- **Web**: React 18 + Vite 6 + TypeScript 5.7
- **State**: Redux Toolkit + react-redux
- **UI**: CSS Modules + Radix primitives
- **API**: Hono + Drizzle ORM
- **DB**: Postgres 16
- **Realtime**: Socket.IO at `/engine.io`
- **Parsers**: private parser package for CEX/DEX/NFT/wallet/explorer receipts
- **Crypto**: WebCrypto wrappers + encrypted inbound body path
- **Deploy**: Docker + nginx SPA + Dokploy/Traefik

## Workspace structure

```text
chainmail/
├── apps/web/                 # React SPA
├── services/api/             # Hono API + Drizzle + realtime + outbound relay
├── services/parsers/         # receipt parser package + fixtures/tests
├── packages/crypto/          # crypto helpers
├── packages/ui/              # shared UI primitives
├── packages/shared-types/    # shared TS types
├── docs/                     # product/architecture/design docs
├── Dockerfile                # web image
└── services/api/Dockerfile   # API image
```

## Commands

```bash
# install
pnpm install

# build all
pnpm -r build

# build web
pnpm --filter web build

# build API
pnpm --filter api build

# parser tests
pnpm --filter parsers test
```

## Implemented

- [x] Auth: sign-in, sign-up, `/me`, JWT session, route guard
- [x] Aliases: list/create/delete
- [x] Mailbox: inbox/sent/drafts/trash/archive/junk/flagged/important routes
- [x] Message detail: body, receipt summary, labels, CSV export action
- [x] Composer: To/Cc/Bcc, validation, queued outbound send, sent folder refresh
- [x] Draft autosave: localStorage restore + discard
- [x] Labels: list/create/delete/assign
- [x] Ledger: tax-year rollup + CSV export
- [x] Ingest route: `POST /api/ingest`, parser run, encrypted body storage, realtime emit
- [x] Parser suite: Coinbase, Binance, Etherscan, Indodax, Kraken, Tokocrypto, Uniswap, OpenSea, Phantom, MetaMask
- [x] Realtime server attached via Socket.IO
- [x] Profile modal + Privacy Center
- [x] Inbox UI overhaul: sidebar 260px, compose 44px, grid topbar, consolidated CSS (-58%), zero !important
- [x] Dark mode disabled/forced light until redesign is ready
- [x] Outbound relay worker foundation via Resend

## Remaining work

- [ ] Configure real outbound provider:
  ```text
  RESEND_API_KEY=...
  OUTBOUND_FROM_EMAIL=...
  ```
  Then restart `chainmail-api` and verify `queued → sent`.
- [ ] Full ingest realtime test using `INGEST_SECRET` and live browser tab.
- [ ] SMTP/MX inbound path for real forwarded email.
- [ ] Better composer visual QA and editor upgrade.
- [ ] Pricing/quote enrichment for ledger USD estimates.
- [ ] PWA/offline cache if needed.

## Outbound relay

Relay worker lives in:

```text
services/api/src/lib/outboundRelay.ts
```

Behavior:

1. Polls queued outbound messages every 15s.
2. Sends via Resend if `RESEND_API_KEY` exists.
3. Marks success:
   ```text
   status = sent
   statusDetail = null
   ```
4. Marks failure:
   ```text
   status = failed
   statusDetail = <error>
   ```
5. If no API key, logs and stays disabled:
   ```text
   [outbound-relay] disabled: RESEND_API_KEY not configured
   ```

## License

MIT for source. Branding/assets reserved until launch decision.
