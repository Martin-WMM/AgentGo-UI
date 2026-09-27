<p align="center">
  <img src="app/public/resources/agentgo-logo.png" alt="AgentGo Logo" width="180">
</p>

<h1 align="center">AgentGo UI</h1>

<p align="center">
  <a href="https://github.com/Martin-WMM/AgentGo-UI/actions/workflows/ci.yml"><img src="https://github.com/Martin-WMM/AgentGo-UI/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://img.shields.io/github/stars/Martin-WMM/AgentGo-UI"><img src="https://img.shields.io/github/stars/Martin-WMM/AgentGo-UI" alt="GitHub stars"></a>
  <img src="https://img.shields.io/badge/Vue-3.5.13-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue 3.5.13">
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.8.2">
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22">
  <img src="https://img.shields.io/badge/pnpm-10.28.1-F69220?logo=pnpm&logoColor=white" alt="pnpm 10.28.1">
</p>

## 1. Introduction / 简介

AgentGo UI is the Vue web client for agent entry, conversations, user settings,
authentication, themes, and localization. It uses [AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend)。

AgentGo UI 是基于 Vue 的 Web 客户端，提供 Agent 入口、会话、用户设置、认证、主题和多语言能力，
统一使用 [AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend)。

## 2. Updates / 更新

- Vue 3 application with routed workspace and shared UI packages.
- Authenticated session/profile state with bilingual interface copy.
- Light/dark theme support and CI quality gates.

- 基于 Vue 3，包含路由工作区和共享 UI 组件包。
- 提供认证会话、用户资料状态和中英文界面文案。
- 支持明暗主题，并由 CI 执行质量检查。

## 3. Getting Started / 快速开始

Requirements / 环境要求: Node.js 22 and pnpm 10.28.1。

```bash
pnpm install
pnpm dev
```

The development server runs at `http://localhost:5173`。

开发服务器地址为 `http://localhost:5173`。

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

## 4. Contribution / 参与贡献

Read [AGENTS.md](AGENTS.md), use the issue-first workflow, and keep backend contract
changes aligned with [AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend)。

请阅读 [AGENTS.md](AGENTS.md)，遵守 Issue-first 流程，并与
[AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend) 保持接口契约一致。

## 5. License / 许可证

This project is governed by the [AgentGo Proprietary License](LICENSE)。All rights
belong to Martin M. W. (王美民). Any use, modification, distribution, or commercial
use requires prior written confirmation at `blessedwmm@gmail.com`。

本项目采用 [AgentGo Proprietary License](LICENSE)。所有权利归 Martin M. W.（王美民）所有。
任何使用、修改、分发或商业用途，均须先通过 `blessedwmm@gmail.com` 获得本人书面确认授权。

## Related Projects / 相关项目

- [AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend) · [AgentGo Desktop](https://github.com/Martin-WMM/AgentGo-desktop)
- [AgentGo Docs](https://github.com/Martin-WMM/AgentGo-docs)
