<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Button } from '@agentgo/ui';
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div class="mb-8 flex items-center gap-3 text-primary">
        <Icon icon="lucide:bot" width="32" height="32" aria-hidden="true" />
        <span class="text-sm font-semibold uppercase tracking-[0.3em]">AgentGo</span>
      </div>
      <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Build and guide your agents from one focused workspace.
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-muted-foreground">
        The AgentGo UI foundation is ready with Vue 3, shadcn-style components, Tailwind CSS 4, and
        Iconify.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <Button>Get started</Button>
        <Button variant="outline">
          <Icon icon="lucide:book-open" width="18" height="18" aria-hidden="true" />
          Read the docs
        </Button>
      </div>
    </section>
  </main>
</template>
