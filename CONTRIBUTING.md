# Contributing to AgentGo UI

## Before opening a pull request

Run the following commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

Pull requests must reference a GitHub Issue and complete the pull request template.

## Commit messages

Use the format:

```text
<emoji><type>: <message>
```

Examples:

```text
✨feat: add agent session panel
🐛fix: preserve keyboard focus in dialog
📝docs: update component usage guide
```

Keep commits focused and below the repository's changed-line limit.
