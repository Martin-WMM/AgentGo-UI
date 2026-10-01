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
- Support both light and dark themes through semantic CSS variables and persist the user's theme
  choice locally.
- Keep user-facing text in the i18n message catalog. The initial locales are `en` and `zh-CN`;
  new user-facing features must provide both translations.
- Preserve keyboard navigation, focus states, semantic HTML, and responsive behavior.
- Do not add GitHub Pages or deploy-branch workflows unless explicitly requested.
- Releases are produced only from `main`; the release workflow creates a `v*` tag, publishes the
  UI image to GHCR, and uploads a compressed image archive to the GitHub Release.
- Keep the production container definition in `Dockerfile` and the SPA fallback configuration in
  `docker/nginx.conf`.

## Backend boundary

- `AgentGo-backend` is the only backend for this web project.
- Keep API clients and server communication directed to `AgentGo-backend`.
- Do not add a second backend, mock server, or independent server implementation to this
  repository unless the task explicitly requires a temporary test double.
- Keep externally visible API contract changes aligned with the
  [AgentGo-backend](https://github.com/Martin-WMM/AgentGo-backend) repository.

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

## Branch governance and AgentGo Project

All branch planning uses [AgentGo GitHub Project #2](https://github.com/users/Martin-WMM/projects/2).
This repository is linked to that shared Project; do not create a separate planning board.

```text
main -> release/<name> -> feature/<issue-number>-<name> or fix/<issue-number>-<name>
     feature/fix -> PR -> their source release/<name> -> PR -> main
main -> hotfix/<issue-number>-<name> -> PR -> main
```

- Create `release/*` and `hotfix/*` from an up-to-date `origin/main`.
- Create `feature/*` and `fix/*` from the intended, up-to-date `origin/release/*`, never directly from `main`.
- A PR into `release/*` must come from `feature/*` or `fix/*` created for that release.
- A PR into `main` must come from `release/*` or `hotfix/*`; feature/fix branches cannot target `main`.
- `main` and every `release/*` prohibit deletion, force pushes, and direct pushes. Change them only through PRs with all required checks passing.
- Retain `release/*` permanently, including after promotion to `main`. Never remove or bypass their deletion protection for cleanup.
- Disable repository-wide automatic head-branch deletion. Cleanup may delete only merged `feature/*`, `fix/*`, and `hotfix/*`.
- After merging a hotfix to `main`, synchronize active release branches through a project-tracked `fix/*` PR based on each affected release; do not push synchronization commits directly.

Before creating any release, feature, fix, or hotfix branch:

1. Create a repository Issue with context, expected outcome, acceptance criteria, and labels.
2. Add it to AgentGo Project #2 and set `Branch`, `Source branch`, `Target branch`, and `Status`.
3. For a release, record `Source branch = main` and `Target branch = main`; for feature/fix, record the same source and target release; for hotfix, record `main` as both.
4. Set `Status = In Progress` when work starts. Create the branch only after verifying Project membership with the authenticated GitHub CLI.
5. Add every associated PR to the same Project, populate its branch fields, and link the Issue using `Closes #<number>`.
6. Set the Issue and PR items to `Done` only when their acceptance criteria are met; retain release planning items and branches.

Each PR body must include the following machine-readable lines in addition to the repository template:

```text
Closes #<issue-number>
Project: https://github.com/users/Martin-WMM/projects/2
Source branch: <main-or-release/name>
```

The required `Branch flow policy` check validates permitted source/target branch types, issue naming and links, the declared source branch, and Git ancestry. Git does not record which checkout command created a branch; agents must verify the Project's source-branch field before creation. The PR check validates the Project declaration; actual Project membership and item fields must be verified with `gh project` during planning and review. Do not claim that a URL alone proves membership.

Use `gh project item-add 2 --owner Martin-WMM --url <issue-or-pr-url>` and `gh project item-edit` to manage items. GitHub Actions' repository token does not provide user-Project automation permissions; never copy an interactive login credential into Actions secrets. Automated Project membership checks require a separately provisioned Projects credential.
