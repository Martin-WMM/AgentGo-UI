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

## Toolchain

- Node.js 22
- pnpm 10.28.1
- Vue 3
- Vite
- TypeScript
- Tailwind CSS 4
- Iconify

## Development

Install dependencies and start the application:

```bash
pnpm install
pnpm dev
```

The development server is available at `http://localhost:5173`.

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
