# Watch Next

TanStack Start application with React, TypeScript, Tailwind CSS, Effect, and Cloudflare Workers.

## Development

```bash
npm ci
npm run dev
```

The home page is in `src/routes/index.tsx`. Routes are generated from `src/routes`.

## UI

[shadcn/ui](https://ui.shadcn.com/docs/installation/tanstack) uses preset `bbVK0Dg`: Base UI, Maia style, neutral colors, and Geist font. Configuration lives in `components.json`; `src/styles.css` contains only the preset theme and base styles.

Use semantic color utilities such as `bg-background` and `text-foreground`. The default is the light palette; the preset's dark palette is available through the `.dark` class.

Add components with:

```bash
npx shadcn@latest add button
```

Effect is installed as a runtime dependency and can be imported from `effect`.

## Checks

```bash
npm run lint
npm run check
npm run typecheck
npm run build
```

`npm run format` fixes lint issues and formats files using Oxlint and Oxfmt. Their configuration excludes generated routes and build output.

## Deployment

Cloudflare Workers configuration lives in `wrangler.jsonc`.

```bash
npm run deploy
```
