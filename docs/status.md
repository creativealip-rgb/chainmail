# Chainmail status — 2026-06-20

## Live endpoints

- Web: https://chainmail.168-144-37-19.sslip.io
- API health: https://api.chainmail.168-144-37-19.sslip.io/api/health

## Current deploys

| Service | Image | Container | IP | Status |
|---|---|---|---|---|
| Web | `chainmail-web:auth-light-r46` | `chainmail-web-v2` | `10.0.1.88` | live |
| API | `chainmail-api:w10-ingest-parser` | `chainmail-api` | `10.0.1.89` | live |
| DB | `postgres:16` | `chainmail-pg` | internal | live |

Traefik dynamic files:

```text
/etc/dokploy/traefik/dynamic/chainmail.yml
/etc/dokploy/traefik/dynamic/chainmail-api.yml
```

## Verified features

- Auth: sign-in, sign-up API, `/api/auth/me`, route guard.
- Mailbox: inbox/sent, message list/detail, parsed receipt summary/details.
- Actions: star/unstar, archive/move/restore, mark/read paths.
- Composer: validation, outbound queue, sent folder, local draft autosave/restore/discard.
- Labels: list/create/delete/assign APIs.
- Aliases: list/create/delete APIs.
- Ledger: year rollup, per-asset/source/chain/month tables, CSV export.
- Profile: avatar/menu/modal.
- Privacy Center: modal overlay.
- UI polish: landing/auth/inbox/message detail polish, responsive breakpoints, forced light mode; dark mode disabled.
- Parsers: 28/28 tests passing.
- API health: DB OK.

## Recent changes

### Web `auth-light-r46`

- Forced light mode globally; dark mode toggle hidden for now.
- Landing page verified light in browser.
- Sign-in/sign-up pages polished with light gradient shell, premium card, better inputs/buttons.
- Inbox/message detail responsive and visual polish remains live.
- Added local draft autosave in composer.
- Added Privacy Center modal wired to sidebar/avatar triggers.

### API `w10-ingest-parser`

- Fixed Binance parser for amount-before-deposit wording:
  - `Your 42.50 USDT deposit on BSC was confirmed.`
- Added regression test for that wording.
- Live `/api/ingest` verified with encrypted storage and parsed receipt.
- Latest parser test suite: 29/29 passing.
- Outbound relay worker from `w9-relay` remains live:
  - polls queued outbound messages every 15 seconds
  - sends via Resend when configured
  - safely disabled if `RESEND_API_KEY` missing

## Required env for outbound delivery

```text
RESEND_API_KEY=...
OUTBOUND_FROM_EMAIL=verified@domain
```

After setting env, restart API:

```bash
docker restart chainmail-api
```

Expected log:

```text
[outbound-relay] started
```

Then send a test message and verify:

```text
status: queued → sent
```

or on provider error:

```text
status: failed
statusDetail: resend <status>: <payload>
```

## Remaining work

1. Configure outbound provider and verify actual delivery.
2. Open browser tab and verify realtime UI update on `/api/ingest` push.
3. MX/SMTP inbound path for real forwarded receipts.
4. Price enrichment for ledger USD estimates.
5. Composer/editor visual QA.
6. Optional PWA/offline cache.

## Useful commands

```bash
pnpm --filter web build
pnpm --filter api build
pnpm --filter parsers test

docker logs --tail=80 chainmail-api
docker logs --tail=80 chainmail-web-v2

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```
