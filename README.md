# Chainmail — Plan

> **Status**: 🟡 Planning v0.1 · 2026-06-18
> **Repo**: `/root/projects/atomicmail-clone` (renaming to `chainmail` after branding lock)
> **Live demo**: `https://chainmail.168-144-37-19.sslip.io` (after deploy; current `atomicmail-clone.168-144-37-19.sslip.io`)
> **Full plan**: see [`PLAN.md`](./PLAN.md)

> E2E encrypted email client · React + Vite + TypeScript pnpm workspace
>
> Reverse-engineered from [atomicmail.io](https://atomicmail.io).
> Full architecture & design analysis in [`docs/`](./docs).

## Status

🚧 **Boilerplate only.** Skeletons for all major components, real crypto, design system, and Storybook stories are wired in. Crypto primitives (Ed25519, secp256k1, BIP39) need `@noble/*` installed for full implementation.

## Stack

- **Web**: React 18 + Vite 6 + TypeScript 5.7
- **UI**: Radix UI primitives + CSS Modules (BEM naming)
- **State**: Redux Toolkit + react-redux
- **HTTP**: ky (fetch wrapper) + swr (cache)
- **Realtime**: socket.io-client
- **Storage**: localforage → IndexedDB
- **Editor**: Jodit + Slate (lazy-loaded)
- **Icons**: Tabler Icons
- **Design tokens**: CSS custom properties (see `src/styles/tokens.css`)
- **Storybook**: 8.4 with Vite

## Structure

```
atomicmail-clone/
├── apps/
│   └── web/                  # React SPA
│       ├── src/
│       │   ├── components/   # sidebar, topbar, mailbox, message, modals
│       │   ├── routes/       # AuthLayout, MailboxRoute, MessageRoute, EncryptedRoute
│       │   ├── store/        # Redux store + 9 slices + socket middleware
│       │   ├── services/     # api, crypto, storage, realtime
│       │   ├── styles/       # tokens.css, globals.css
│       │   ├── stories/      # Storybook stories
│       │   ├── hooks/        # useAppDispatch, useAppSelector
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── .storybook/       # Storybook config
│       └── package.json
├── packages/
│   ├── crypto/               # WebCrypto wrappers (Ed25519, secp256k1, AES-GCM, scrypt, pbkdf2, BIP39)
│   ├── ui/                   # Radix-based primitives (Button, Input, Avatar, Spinner, Switch, Tooltip, Dialog, DropdownMenu, Popover)
│   └── shared-types/         # TypeScript types shared across apps
└── docs/
    ├── struktur.md           # Architecture, routes, storage, crypto pipeline
    └── desain.md             # Design system, colors, typography, components
```

## Quick start

```bash
# install
pnpm install

# run web dev (port 5173)
pnpm dev

# run storybook (port 6006)
pnpm storybook

# typecheck
pnpm typecheck

# build all
pnpm build
```

## What's implemented

- [x] Vite + React + TS + RTK scaffold
- [x] CSS tokens (full design system in tokens.css)
- [x] Radix-based UI primitives (Button, Input, Avatar, Spinner, Switch, Tooltip, Dialog, DropdownMenu, Popover)
- [x] 9 Redux slices (auth, messages, folders, aliases, encryption, composer, user, ui, notifications)
- [x] Socket.IO middleware
- [x] ky HTTP client + swr fetcher
- [x] localforage storage wrapper
- [x] App routes (Auth, Mailbox, Message, Encrypted)
- [x] Sidebar, TopBar, MailboxView, MessageView skeletons
- [x] Storybook stories for all primitives
- [x] Bundle splitting: react / redux / crypto / editor chunks
- [x] WebCrypto skeleton (AES-GCM done, Ed25519/secp256k1 need @noble)

## What's TODO

- [ ] Install `@noble/curves`, `@noble/ed25519`, `@noble/hashes`, `@scure/bip39` and implement crypto
- [ ] Compose modal (Jodit editor + encryption picker + recipient autocomplete)
- [ ] 2FA setup modal (TOTP QR + code verify)
- [ ] Alias create flow
- [ ] Privacy Center sidebar overlay
- [ ] Settings modal (Account, Plan, Appearance)
- [ ] Real API integration (currently `api.atomicmail.io` mock)
- [ ] Auth flow wiring (sign-in 2-step form)
- [ ] Service worker / PWA support
- [ ] Skeleton loading states (gap noted in `docs/desain.md` § 13)
- [ ] Keyboard shortcut for search (Cmd+K) and compose (C)

## License

MIT · personal project, not for production use of Atomic Mail's branding.
