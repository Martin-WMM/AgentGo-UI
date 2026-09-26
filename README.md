# AgentGo UI

AgentGo UI is the AgentGo web application built with Vue 3, TypeScript, Tailwind CSS 4,
shadcn-style components, and Iconify.

## Repository structure

This repository uses a pnpm workspace monorepo modeled after AgentGo Docs:

```text
app/                 # AgentGo web application
packages/ui/         # Shared shadcn-style Vue components and design tokens
```

The application consumes shared UI components through the `@agentgo/ui` workspace package.

## Backend

This web project has one backend: [AgentGo-backend](https://github.com/Martin-WMM/AgentGo-backend).
All web API integrations, authentication flows, and server-side data requests must target that
backend. Do not introduce a second backend or an independent server implementation in this
repository.

## Toolchain

- Node.js 22
- pnpm 10.28.1
- Vue 3
- Vite
- TypeScript
- Tailwind CSS 4
- Iconify
- vue-i18n with English and Simplified Chinese locales

## Development

Install dependencies and start the application:

```bash
pnpm install
pnpm dev
```

The development server is available at `http://localhost:5173`.

## Themes and localization

The application supports light and dark modes. The initial mode follows the system preference
when no user choice has been saved; subsequent choices are persisted in local storage.

The initial locales are English (`en`) and Simplified Chinese (`zh-CN`). The selected locale is
also persisted locally. Add shared translations in `app/src/i18n.ts` and keep user-facing text
out of components when it is expected to be translated.

## Quality checks

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

## Git workflow

Changes follow:

```text
main -> release/* -> feature/* or fix/* -> PR -> release/* -> PR -> main
```

The project does not use a special deploy branch or GitHub Pages deployment. Deployment
automation is intentionally outside this repository's initialization scope.

## UI conventions

- Put reusable components in `packages/ui`.
- Keep application-specific composition in `app`.
- Use shadcn-style component patterns with Tailwind utility classes and `cn()` merging.
- Use Iconify for icons instead of adding an icon-specific dependency per feature.
- Keep accessible labels, keyboard behavior, and visible focus states in interactive components.
- Keep user-facing documentation and pull request descriptions in English.
