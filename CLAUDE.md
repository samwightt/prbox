# prbox - GitHub Notifications CLI

A terminal UI for triaging GitHub notifications. Built with Bun, [Ink](https://github.com/vadimdemedes/ink) (React for CLIs), and the GitHub GraphQL API via the `gh` CLI.

## The Problem

GitHub's notification system is broken for teams with high notification volume (monorepos, multiple team memberships). Most notifications aren't actionable:

- PRs where a teammate already handled the review for your team
- PRs you were added to then removed from as a reviewer (notifications persist forever)
- Drafts, merged PRs, or closed PRs
- PRs you've already reviewed

Worse, GitHub doesn't show *why* you're receiving a notification. A commit push, a bot comment, a reply to your review, and a re-requested review all look identical. You have to click into each one to find out.

## How prbox Fixes This

The key insight is that `prbox` checks the **current state** of each PR via the GraphQL API, not just what GitHub's notification says. This enables smart categorization:

- **needs_review** - PRs where your review is *currently* pending. Checks actual pending reviewers right now and compares against your team memberships.
- **replied** - PRs where someone replied to your review comments. GitHub doesn't surface this unless you're @mentioned.
- **team_reviewed** - PRs where a teammate already reviewed on behalf of your team. Shows *who* handled it. These are 50-60% of notifications and can usually be marked done without looking.
- **reviewed** - PRs you've already approved.
- **merged** / **closed** / **draft** - Filtered by actual PR state.

The tool is also **team-aware**: it fetches your team memberships and shows which of your teams need to review PRs, and who on your team already handled reviews.

## Project Structure

> **Important:** When moving, renaming, or reorganizing files, update this section of CLAUDE.md to match.

- `src/cli.tsx` - Entry point, renders the Ink app
- `src/types.ts` - TypeScript types for parsed notifications
- `src/constants.ts` - Kaomoji, greetings, loading messages, farewells
- `src/hooks/useNotifications.ts` - Fetches notifications via GraphQL, handles mutations (mark read/done/unsubscribe)
- `src/hooks/useKeyboardNav.ts` - Vim-style keyboard input handling
- `src/hooks/useDisplayItems.ts` - Filters and groups notifications into tabs
- `src/components/` - Ink React components (TabBar, NotificationList, NotificationItem, Footer, HelpScreen, etc.)

Seen notification history is persisted to `~/.gh-notifications-seen.json`.

## Running

```sh
bun src/cli.tsx
```

Requires `gh` CLI with `notifications` and `read:org` scopes:
```sh
gh auth login -s notifications,read:org
```

---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Changesets

This repo uses changesets. Any time you open a PR or make a substantial change that could be considered a patch, minor, or major change, create a changeset. Be sure it's descriptive enough for the changelog but not overly long.
