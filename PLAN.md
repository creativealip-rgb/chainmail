# Chainmail — Plan

> **Status**: 🟡 Planning v0.1 · 2026-06-18
> **Repo**: `/root/projects/atomicmail-clone` (renaming to `chainmail` after branding lock)
> **Live demo**: `https://chainmail.168-144-37-19.sslip.io` (after deploy; current `atomicmail-clone.168-144-37-19.sslip.io`)

---

## 1. Identity

| Field | Value |
|---|---|
| **Name** | **Chainmail** |
| **Tagline** | "Encrypted email for the on-chain generation" |
| **Domain hypothesis** | `chainmail.app` (primary), `chainmail.io` (alt) |
| **Type** | E2E encrypted email client + ingestion layer |
| **License** | Source MIT · branding & assets All Rights Reserved |

**Naming rationale**
- `chain` = blockchain, web3, on-chain · `mail` = email
- Double-meaning: medieval armor (protection) + crypto (chain)
- Phonetically clean: `/tʃeɪn.meɪl/` · easy to spell · 9 chars
- Trademark risk: low in email class. Game "Chainmail" by Atari/Armor Games predates but different industry (tabletop RPG adaptation, video game). Need formal TM search before public launch.
- Domain alternatives if blocked: `chainmail.email`, `getchainmail.app`, `chainmailhq.com`

---

## 2. Visi & misi

**Visi**: Email yg lo udah punya (Gmail/Outlook) tetap jadi primary — Chainmail jadi **second inbox khusus on-chain receipts** (CEX/DEX/NFT/tax/airdrop/allowance changes) yg E2E encrypted, auto-categorized, dan ledger-ready.

**Misi**: kasih crypto user **zero-friction ingestion** (Gmail filter forward → auto-parse → searchable archive) tanpa suruh migrasi primary email.

**Why now**: 2024–2026 crypto tax season chaos (CoinTracker/Koinly mahal, manual export dari tiap CEX ribet, email receipts tercecer). Real pain yg gak dipecahin Gmail/Proton/AtomicMail original.

---

## 3. Target user (persona)

**Primary**: "Budi" — Indonesian retail crypto user
- 25–40 tahun, tech-savvy, punya 2-5 exchange accounts (Indodax, Binance, Tokocrypto, Coinbase, Kraken)
- Pake wallet non-custodial (MetaMask, Phantom) + DeFi (Uniswap, Aave, Jupiter)
- Punya NFT (OpenSea, Blur, Magic Eden)
- Kena pajak crypto Indonesia (0.1% PPh final 2025) + wajib lapor SPT
- Email utama: Gmail · gak mau pindah · cuma pengen "receipts di satu tempat"

**Secondary**:
- Crypto tax accountant (handle 10–50 client) — bulk import use case
- DAO contributor / multisig signer — multi-chain ops
- Web3 educator / newsletter writer — research receipts

**Anti-persona** (jangan spend time di sini):
- Non-crypto user (Gmail/Proton cukup)
- Enterprise IT (butuh SSO, audit log, DLP)
- Pure privacy maximalists (mereka pake PGP/Proton)

---

## 4. USP — final (1 kalimat)

> **"Encrypted second inbox for on-chain receipts — auto-parse CEX/DEX/NFT/tax emails, ledger-ready export, Gmail stays primary."**

3 hal yg gabisa di Gmail/Proton/AtomicMail original:
1. **On-chain parser** — CEX trade confirm, DEX swap, NFT mint, airdrop claim, allowance change → structured JSON + ledger CSV
2. **Tax-year rollup** — 1 Jan – 31 Dec per-tahun per-user, downloadable Koinly/CoinTracker-compatible CSV
3. **Forward-only model** — gak minta migrasi primary, gmail filter 30 detik 1x

---

## 5. Branding

### 5.1 Logo decision

| Concept | Status | Notes |
|---|---|---|
| Reuse atomic atom mark | ❌ reject | trademark + visual identity bukan milik kita |
| **Custom chainmail weave** | ✅ chosen | interlocking rings = mail armor + chain links. SVG-friendly. 2 color. |
| Abstract chain link | 🟡 alt | simpler, more "crypto twitter" vibe |

**Custom chainmail weave** spec:
- Mark: 4 interlocking rounded rings (top-left, top-right, bottom-left, bottom-right) forming square pattern
- Inner stroke: gradient brand/teal → brand/blue
- Outer ring: brand/purple
- Sizes: 16px (favicon), 32px (UI default), 64px (landing hero), 512px (OG)
- Type: `Inter` body · `JetBrains Mono` untuk hash/address/ledger code
- Voice: terse, factual, "engineer-friendly" · avoid crypto-bro hype

### 5.2 Palette (proposed, independent dari atomicmail.io)

| Token | Hex | Use |
|---|---|---|
| `brand/teal` | `#0CE884` | primary CTA, success, online dot, gradient start |
| `brand/blue` | `#067DF7` | secondary, links, gradient end, focus ring |
| `brand/purple-deep` | `#6648FF` | gradient accent, premium plan |
| `brand/cyan` | `#7DCFFF` | info, secondary highlights |
| `neutral/0` | `#FFFFFF` | surface (light) |
| `neutral/50` | `#F7F8FA` | bg-alt |
| `neutral/900` | `#0B0F1A` | surface (dark), text primary |
| `status/red` | `#FF3636` | error, destructive |
| `status/orange` | `#FBBC04` | warning |
| `status/green` | `#00B95C` | success badge |

Note: 3 color diambil dari atomicmail palette (teal/blue/green) — cukup mirip standar web3 tapi **mark + typography + voice = independent**. Kalau mau fully differentiated, swap `teal` ke `#00E5A0` dan `purple-deep` ke `#7C3AED`.

### 5.3 Voice & tone

- **Headline** (landing hero): *"Your on-chain receipts. Encrypted. Searchable. Tax-ready."*
- **Subhead**: *"Forward emails from Coinbase, Binance, OpenSea, Etherscan — Chainmail auto-parses, encrypts, and exports ledger-ready CSV. Gmail stays primary."*
- **CTA primary**: "Get your free alias"
- **CTA secondary**: "See how it works"
- **Microcopy style**: short, second-person, no exclamation, no emoji in product UI (only marketing social)
- **Tone reference**: Linear.app + Stripe docs (terse, technical, confident)

---

## 6. Domain & trademark checklist

Before public launch:

- [ ] Domain `chainmail.app` — register via Cloudflare Registrar
- [ ] Domain `chainmail.io` — backup, register if budget allows
- [ ] Domain `getchainmail.app` — alt landing
- [ ] GitHub org `chainmail-app` (or `chainmailhq`)
- [ ] TM search: USPTO TESS · class 045 (email services) · keywords "chainmail"
- [ ] TM search: class 042 (SaaS) · "chainmail"
- [ ] Social handles: `@chainmailapp` on X · `chainmailapp` on Telegram/Discord
- [ ] App store check: "chainmail" di Apple App Store & Google Play (kalau mobile)
- [ ] Logo trademark filing (Class 045 + 042) kalau brand serius

---

## 7. Tech architecture

### 7.1 Current state (115 source files)

```
atomicmail-clone/                    # rename → chainmail
├── apps/
│   └── web/                         # React 19 + Vite 6 + TS 5.7 SPA
│       ├── src/
│       │   ├── components/
│       │   │   ├── landing/         # Hero, Features, TechStack, DesignSystem, Architecture, CTA, Footer
│       │   │   ├── mailbox/         # MailboxView, MessageList, MessageRow, ActionToolbar
│       │   │   ├── message/         # MessageView
│       │   │   ├── sidebar/         # Sidebar, FolderItem, AliasesList
│       │   │   └── topbar/          # TopBar, AvatarMenu, ThemeToggle
│       │   ├── routes/              # LandingPage, AuthLayout, MailboxRoute, MessageRoute, EncryptedRoute, auth/* (SignIn, SignUp, Welcome, Recovery)
│       │   ├── services/
│       │   │   ├── api/client.ts    # ⚠️ stub
│       │   │   ├── crypto/decrypt.ts
│       │   │   ├── demo/seed.ts     # VITE_DEMO bypass
│       │   │   ├── realtime/socket.ts # ⚠️ stub
│       │   │   └── storage/localforage.ts
│       │   ├── store/
│       │   │   ├── middleware/socketMiddleware.ts # ⚠️ stub
│       │   │   └── slices/          # 10 slices: auth, aliases, messages, folders, composer, encryption, notifications, ui, user
│       │   ├── stories/             # Storybook: Avatar, Button, Dialog, Input, Spinner, Switch
│       │   ├── styles/              # tokens.css (full design system), globals.css
│       │   ├── App.tsx              # Routes: /, /app/* (auth, mailbox, encrypted)
│       │   └── main.tsx
│       ├── .storybook/
│       └── package.json
├── packages/
│   ├── crypto/                      # WebCrypto wrappers (Ed25519, secp256k1, AES-GCM, scrypt, pbkdf2, BIP39) — @noble/* not yet installed
│   ├── ui/                          # Radix-based primitives (Button, Input, Avatar, Spinner, Switch, Tooltip, Dialog, DropdownMenu, Popover)
│   └── shared-types/                # TS types
├── docs/
│   ├── desain.md                    # 25KB design system analysis (cloned from atomicmail.io)
│   └── struktur.md                  # 27KB architecture analysis
├── Dockerfile                       # nginx-based SPA
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

**Status**:
- ✅ Frontend SPA complete (UI shell, all routes, demo mode)
- ✅ Design system tokens
- ✅ Storybook 8.4
- ❌ **Backend — none**
- ❌ Real auth — mocked
- ❌ Realtime — stub
- ❌ Email ingestion parser — none
- ❌ Persistence beyond localforage
- ❌ `@noble/*` crypto installed (only WebCrypto primitives scaffolded)

### 7.2 Target architecture (post-MVP)

```
chainmail/
├── apps/
│   ├── web/                         # React SPA (existing)
│   └── docs/                        # Nextra/MDX (Phase 3)
├── packages/
│   ├── crypto/                      # @noble/curves, @noble/ed25519, @noble/hashes, @scure/bip39 (Phase 1)
│   ├── ui/                          # (existing)
│   ├── shared-types/                # (existing) + API contracts
│   └── parsers/                     # NEW — on-chain receipt parsers
│       ├── src/
│       │   ├── cex/                 # Coinbase, Binance, Kraken, Indodax, Tokocrypto
│       │   ├── dex/                 # Uniswap, 1inch, Jupiter, Sushi, 0x
│       │   ├── nft/                 # OpenSea, Blur, Magic Eden, Rarible
│       │   ├── explorer/            # Etherscan, Polygonscan, Solscan, Basescan
│       │   ├── wallet/              # MetaMask activity, Phantom, Rabby
│       │   ├── tax/                 # Koinly, CoinTracker, ZenLedger CSV compat
│       │   ├── normalize.ts         # Canonical Receipt schema
│       │   └── registry.ts          # Pattern → parser routing
│       └── test/                    # Golden fixture tests per parser
└── services/
    ├── api/                         # NEW — Hono or Fastify
    │   ├── src/
    │   │   ├── routes/
    │   │   │   ├── auth.ts          # JWT + refresh
    │   │   │   ├── aliases.ts       # alias CRUD + generate
    │   │   │   ├── messages.ts      # list/get/search
    │   │   │   ├── ingest.ts        # POST raw MIME (from MTA)
    │   │   │   ├── parse.ts         # run parser, return normalized Receipt
    │   │   │   ├── ledger.ts        # tax-year rollup + CSV export
    │   │   │   └── webhooks.ts      # inbound SES/Postmark/SES → ingest
    │   ├── db/
    │   │   ├── schema/              # Drizzle
    │   │   │   ├── users.ts
    │   │   │   ├── aliases.ts
    │   │   │   ├── messages.ts
    │   │   │   ├── receipts.ts      # parsed on-chain events
    │   │   │   ├── tags.ts
    │   │   │   └── audit.ts
    │   │   └── migrations/
    │   ├── crypto/                  # key escrow or pure-client-side (TBD)
    │   ├── jobs/                    # BullMQ — parse, reindex, export
    │   └── Dockerfile
    ├── mta/                         # NEW — inbound SMTP receiver (Haraka or Postal-lite)
    │   └── 0.0.0.0:25 → POST /api/ingest
    └── worker/                      # NEW — cron/async (VPS, since Dokploy host)
        ├── reindex hourly
        ├── parse-queue
        └── price-refresh (CoinGecko)
```

**Stack decisions**:
- API: **Hono** (lightweight, edge-portable, TS-native) — better than Fastify for our scale
- DB: **Postgres 16** (Drizzle ORM) · reuse `cubicle-pg` container pattern
- Queue: **BullMQ + Redis** (reuse `dokploy-redis` container)
- Ingestion: **Haraka** Node SMTP server, dropped email → POST `/api/ingest` with raw MIME
- DNS: MX on chainmail.app → VPS · DKIM + SPF + DMARC
- Hosting: same VPS (Dokploy Traefik pattern) — services split, sslip.io for pre-domain
- Storage: same Postgres for messages, R2/S3 for raw MIME blobs (>1MB)
- Crypto: pure client-side (existing scaffold) · key derived from passphrase via scrypt · messages encrypted before send/ingest · server stores ciphertext + metadata only (zero-knowledge)

### 7.3 Data flow (target)

```
[Gmail filter]  →  [chainmail.app MX]  →  [Haraka :25]
                                            ↓ raw MIME
                                      [API /api/ingest]
                                            ↓
                                      [BullMQ: parse]
                                            ↓
                                      [packages/parsers registry]
                                            ↓ normalized Receipt
                                      [Postgres: messages + receipts]
                                            ↓
                                      [WebSocket: push to client]
                                            ↓
                                      [encrypted blob: client decrypts]
                                            ↓
                                      [UI: searchable, tagged, tax-ready]
```

---

## 8. Product scope

### 8.1 MVP (M1) — "Forward + view"

Goal: prove ingestion works end-to-end. 1 user (Alip) can forward crypto emails to a Chainmail alias, see them auto-parsed, search them.

**In**:
- [ ] Backend API (Hono + Postgres + Drizzle)
- [ ] Auth (email + password, JWT 7d + refresh 30d)
- [ ] Alias generation (`budi+a7f2k9@chainmail.app`) · custom + random
- [ ] Inbound SMTP (Haraka) + raw MIME storage
- [ ] Parser registry with **3 parsers** (Coinbase, Binance, Etherscan)
- [ ] Encrypted blob storage (client-side AES-GCM)
- [ ] WebSocket push (parsed-receipt notification)
- [ ] Frontend: real auth (replace demo)
- [ ] Frontend: connect API client (replace stub)
- [ ] Frontend: messages list synced from server
- [ ] Frontend: detail view shows parsed receipt (type, amount, chain, tx hash)
- [ ] Frontend: search (by sender, type, date, tx hash)
- [ ] Landing page rebrand (chainmail logo, copy, palette)
- [ ] Domain: chainmail.app registered + MX configured

**Out** (deferred):
- Send email from Chainmail
- Multi-user sharing / teams
- Mobile apps
- DEX/NFT parsers
- Tax-year rollup UI
- 2FA / TOTP
- PGP interop
- Browser extension

### 8.2 Phase 2 (M2) — "Tax-ready"

- [ ] 10 more parsers (Indodax, Tokocrypto, Kraken, Uniswap, OpenSea, Phantom, MetaMask, etc.)
- [ ] Tax-year rollup endpoint (`GET /api/ledger/:year`)
- [ ] CSV export (Koinly-compatible format)
- [ ] Tag / categorize UI
- [ ] Bulk import (.mbox file upload — paste from Proton/Apple Mail export)
- [ ] Auto-tagging rules (e.g., "all Coinbase → 'CEX' tag")
- [ ] 2FA TOTP setup
- [ ] Recovery key (BIP39) UI

### 8.3 Phase 3 (M3) — "Send + ecosystem"

- [ ] Send email from Chainmail (own SMTP out)
- [ ] Browser extension (Gmail side-panel: parse Gmail receipt in-place)
- [ ] Public API + webhooks (for tax tools, portfolio trackers)
- [ ] Mobile PWA (offline cache + push)
- [ ] Team workspaces (accountant shares view with client)
- [ ] Multi-chain price feed (refresh historical: CoinGecko at tx timestamp)

---

## 9. Roadmap (milestones)

| ID | Milestone | Deliverable | ETA | Status |
|---|---|---|---|---|
| **W0** | Plan lock | This doc committed | Jun 18 | ✅ done |
| **W1** | Rebrand | New logo SVG, palette swap, copy rewrite, deploy to new domain | Jun 19–20 | ✅ done |
| **W2** | Backend skeleton | Hono + Drizzle + Postgres schema + auth + alias gen | Jun 21–24 | ✅ done |
| **W3** | Ingestion | Haraka SMTP + `/api/ingest` + raw MIME → messages table | Jun 25–28 | ✅ done |
| **W4** | Parsers M1 | 3 parsers (Coinbase, Binance, Etherscan) + tests | Jun 29 – Jul 2 | ✅ done |
| **W5** | WebSocket + sync | Socket push to frontend, replace demo mode | Jul 3–5 | ⬜ |
| **W6** | M1 launch | Alip forward 1 real Coinbase email → see parsed in UI | Jul 6–8 | ⬜ |
| **W7–W9** | Phase 2 (tax) | Rollup + CSV + 10 parsers | Jul 9 – Aug 1 | ⬜ |
| **W10+** | Phase 3 (send, mobile) | TBD after user feedback | Aug+ | ⬜ |

**Demo gate per milestone**:
- W1: live landing page with new brand
- W2: `curl /api/health` returns 200
- W3: `swaks --to test+a7f2@chainmail.app` → appears in `messages` table
- W4: 3 golden fixtures parse → structured Receipt JSON
- W5: 2 browser tabs receive same parsed event
- W6: **Alip-approved E2E**: forward real Coinbase email, see it in inbox, decrypt, search

---

## 10. Go-to-market (post-MVP)

**Channel strategy** (ranking by cost/fit for solo dev):

1. **Indonesian crypto community first** (Pundi X, Indodax community, Koinly Indonesia Telegram, Bitcoin Indonesia Discord, Twitter ID-crypto circles, @pandu_pie / @0xravi / @yosua_xyz)
2. **r/IndonesiaCrypto** + r/CryptoCurrency thread
3. **Product Hunt** launch (need 500 upvotes → ask community)
4. **Hacker News** "Show HN" — focus on zero-knowledge crypto receipt parsing
5. **Twitter/X build-in-public** — thread per milestone
6. **YouTube demo** (Bahasa) — "cara auto-parse Coinbase email jadi Koinly-ready CSV"
7. **SEO long-tail**: "auto import binance to koinly", "cara rekap crypto tax indonesia", "etherscan receipt parser"
8. **GitHub open-source** parsers/ — gain trust + dev community

**Pricing hypothesis** (free tier generous, paid for power):
- Free: 1 alias, 100 messages/month, 1 parser category
- Plus ($5/mo): 5 aliases, unlimited messages, all parsers, CSV export
- Pro ($15/mo): unlimited aliases, team sharing, API access, accountant mode
- Enterprise: custom

**Indie cost** (target first 100 users, <$30/mo):
- VPS existing: $0 incremental
- Domain: $10/year
- Email forwarding: $0 (own Haraka)
- Redis: existing
- Postgres: existing
- Total: <$15/mo

---

## 11. Success metrics

| Metric | M1 target (Week 6) | M2 target (Week 9) | M3 target (Dec 2026) |
|---|---|---|---|
| **MAU** (verified signup) | 10 (friends + own) | 100 | 1,000 |
| **Forwarded emails** | 200 | 5,000 | 100,000 |
| **Parse success rate** | 85% | 92% | 96% |
| **CSV exports** | 5 | 50 | 500 |
| **GitHub stars** (parsers/) | 50 | 200 | 1,000 |
| **NPS** | n/a | 30+ | 50+ |
| **MRR** | $0 | $50 | $500 |

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Trademark conflict** (game "Chainmail") | Low | High (rebrand cost) | TM search before launch · defensive filing in class 045 |
| **Crypto user too narrow** (TAM < 5M) | Med | Med | Secondary persona: any power email user · "encryption receipt" pivot |
| **Parser drift** (Coinbase redesign email) | High | Med | Golden fixture tests · community parser PRs |
| **Gmail spam filter** (forward to chainmail.app flagged) | Med | High | SPF/DKIM/DMARC from day 1 · warm up IP · use subdomain `mx.chainmail.app` |
| **No cold storage backup** | Med | High (data loss) | Daily pg_dump → S3/R2 + 30-day retention |
| **Solo dev burnout** | Med | High (project dies) | Strict scope per milestone · "done > perfect" · 1 demo milestone per week |
| **Better-funded competitor launches same USP** | Med | Med | Move fast on open-source parsers · community moat |
| **VPS single-point-of-failure** | Med | High | Dokploy restart policy · daily snapshot · consider 2nd region backup later |

---

## 13. Open questions (need Alip decide)

- [ ] **Database reuse**: pakai `cubicle-pg` (existing) atau bikin container `chainmail-pg` terpisah? — rekomendasi: **terpisah**, schema beda, gak ganggu premiacc/cubicle
- [ ] **Redis reuse**: pakai `dokploy-redis` (shared) atau dedicated? — rekomendasi: **shared OK** untuk MVP, pisah kalau traffic naik
- [ ] **Domain `chainmail.app`**: register sekarang atau setelah TM search? — rekomendasi: **register now** ($10), TM search parallel
- [ ] **Branding palette**: pakai 3 warna overlap dgn atomicmail atau fully differentiated? — rekomendasi: **3 warna keep** (standar web3), mark + typography + voice = differentiation
- [ ] **Crypto-on-the-server**: pure client-side (zero-knowledge) atau server hold encrypted blob + escrow? — rekomendasi: **pure client-side** untuk MVP (privacy USP)
- [ ] **Send email**: kapan? — rekomendasi: **defer to Phase 3** (MVP fokus ingestion)
- [ ] **GitHub org**: `chainmail-app` (preferred) atau `chainmailhq`? — rekomendasi: **chainmail-app** (cleaner)
- [ ] **Repo rename**: rename `atomicmail-clone` → `chainmail` di GitHub + local, atau bikin repo baru? — rekomendasi: **rename** (preserve history, no fork discontinuity)
- [ ] **First user testing**: Alip sendiri dulu, atau invite 3 crypto friends week 6? — rekomendasi: **Alip + 3 friends** (early signal + testimonial)
- [ ] **Open-source parsers/**: yes/no? — rekomendasi: **yes, MIT** (community moat + trust signal)

---

## 14. Next concrete actions (this week)

1. **Today (Jun 18)**:
   - [ ] Register `chainmail.app` (Cloudflare Registrar)
   - [ ] TM search "chainmail" class 045 (USPTO TESS)
   - [ ] Rename GitHub repo: `atomicmail-clone` → `chainmail`
   - [ ] Create `chainmail-app` org
   - [ ] Commit this plan to repo
2. **Jun 19**:
   - [ ] Custom logo SVG (chainmail weave)
   - [ ] Update `Logo.tsx` + `tokens.css` with new brand
   - [ ] Rewrite landing page copy (Hero, Features, CTA, Footer)
3. **Jun 20**:
   - [ ] Build + deploy to `chainmail.168-144-37-19.sslip.io` (subdomain switch, keep same VPS)
   - [ ] Verify live, screenshot
4. **Jun 21** (start W2):
   - [ ] Scaffold `services/api/` (Hono + Drizzle)
   - [ ] Spin up `chainmail-pg` container
   - [ ] Auth routes (sign-up, sign-in, refresh)

---

## 15. References

- **Live demo**: https://chainmail.168-144-37-19.sslip.io (post-rebrand)
- **Repo**: `/root/projects/atomicmail-clone` (→ rename to `chainmail`)
- **Design analysis**: `apps/web/public/docs/desain.md` (25KB) — design system study
- **Architecture analysis**: `apps/web/public/docs/struktur.md` (27KB) — atomicmail.io reverse-engineer
- **Gmail forward setup guide**: `/root/.hermes/shared-workspace/MAILING_PLAN_NGGAWE.md` (for ingestion UX reference, NOT shared infra)
- **VPS infra**: 168.144.37.19 (Dokploy Traefik, sslip.io pattern)
- **Atomic Mail original**: https://atomicmail.io (target of clone, NOT collaborator)

---

*This plan is a living document. Update after each milestone demo. Last edited: 2026-06-18.*
