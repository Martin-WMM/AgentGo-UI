# AgentGo UI Contribution Guide

This file contains repository-specific instructions for AgentGo UI.

## Project structure

AgentGo UI is a pnpm workspace monorepo:

- `app`: Vue 3 application and route-level composition.
- `packages/ui`: Shared shadcn-style Vue components, Tailwind tokens, and UI utilities.

The repository uses Node.js 22 and pnpm 10.28.1. Keep dependency versions in the root
workspace configuration where possible and keep workspace package dependencies on `workspace:*`.

## Development commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

Run commands from the repository root so pnpm resolves all workspace packages.

## UI conventions

- Put reusable UI primitives in `packages/ui`.
- Keep page and application composition in `app`.
- Use Vue 3 Composition API and `<script setup lang="ts">` for new components.
- Use Tailwind CSS 4 utilities and shadcn-style variant patterns.
- Use `cn()` for class merging and `class-variance-authority` for component variants.
- Use Iconify for icons and provide accessible labels or hidden text where needed.
- Preserve keyboard navigation, focus states, semantic HTML, and responsive behavior.
- Do not add GitHub Pages or deploy-branch workflows unless explicitly requested.

## Git workflow

The intended flow is:

```text
main -> release/* -> feature/* or fix/* -> PR -> release/* -> PR -> main
```

`main` and `release/*` are protected branches and should be changed through pull requests.
Pull requests must reference a GitHub Issue and pass CI, security, typecheck, test, lint,
format, and build checks.

Commit messages must use:

```text
<emoji><type>: <message>
```

Keep each commit focused and below 200 changed lines, excluding lockfile-only churn where the
CI policy allows it.

## Dependencies and security

- Avoid adding duplicate icon, CSS, or component libraries when an existing workspace package
  already provides the capability.
- Keep secrets in local `.env` files; never commit them.
- Review dependency updates with `pnpm audit` and the repository security workflow.
- Document externally visible UI or API contract changes when they affect AgentGo clients.
