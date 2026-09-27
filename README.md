<p align="center">
  <img src="app/public/assets/logo-dark.png" alt="AgentGo" width="180">
</p>

<h1 align="center">AgentGo UI</h1>

<p align="center">
  <a href="https://github.com/Martin-WMM/AgentGo-UI/actions/workflows/ci.yml"><img src="https://github.com/Martin-WMM/AgentGo-UI/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/Martin-WMM/AgentGo-UI"><img src="https://img.shields.io/github/stars/Martin-WMM/AgentGo-UI" alt="GitHub stars"></a>
</p>

AgentGo 的 Vue Web 客户端，提供 Agent 入口、会话、用户设置和主题/语言切换。后端统一使用 [AgentGo Backend](https://github.com/Martin-WMM/AgentGo-backend)。

## 快速开始

要求：Node.js 22、pnpm 10.28.1。

```bash
pnpm install
pnpm dev
```

开发服务器：`http://localhost:5173`。

质量检查：

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

## 项目结构

- `app/`：Web 应用和路由页面。
- `packages/ui/`：共享 Vue 组件和设计令牌。

## 文档

架构、认证、部署、扩展和贡献说明请查看 [AgentGo Docs](https://github.com/Martin-WMM/AgentGo-docs)，尤其是[快速上手](https://github.com/Martin-WMM/AgentGo-docs/tree/main/app/src/resources/%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B)和[集成与扩展](https://github.com/Martin-WMM/AgentGo-docs/tree/main/app/src/resources/%E9%9B%86%E6%88%90%E4%B8%8E%E6%89%A9%E5%B1%95)。
