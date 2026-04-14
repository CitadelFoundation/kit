# @citadelfoundation/kit-publishing

Git-native, local-first publishing primitives for Astro sites. The package ships a public CLI, three built-in site templates, a local studio host, and Astro-facing content loaders.

**This package runs on [Bun](https://bun.sh).** Node.js is not a supported CLI runtime.

## Quick start

```bash
bunx @citadelfoundation/kit-publishing create my-site --template starter --deploy cloudflare-pages
cd my-site
bun install
bun run studio:dev
```

That creates a full Astro site workspace with the publishing content tree, a `publication.config.ts`, and the local studio entrypoint already wired in.

## CLI

### `create`

Create a new site from a built-in template:

```bash
bunx @citadelfoundation/kit-publishing create <directory> --template <blank|starter|publication> [--deploy <none|cloudflare-pages>]
```

Or import a template from a local path, Git repo, or npm package:

```bash
bunx @citadelfoundation/kit-publishing create <directory> --from <source> [--subdir <path>] [--deploy <none|cloudflare-pages>]
```

Supported `--from` sources:

- local directory path
- Git URL or a path ending in `.git`
- npm package spec prefixed with `npm:`

Examples:

```bash
bunx @citadelfoundation/kit-publishing create my-site --template publication
bunx @citadelfoundation/kit-publishing create my-site --from ./my-template
bunx @citadelfoundation/kit-publishing create my-site --from npm:@scope/my-template
```

`create` refuses non-empty target directories, infers a package name and site title from the target directory, and writes the optional Cloudflare Pages preset when requested.

### `studio`

Start the local publishing studio host for an existing site:

```bash
bunx @citadelfoundation/kit-publishing studio --root <directory> [--host <host>] [--port <port>]
```

The site root must contain `publication.config.ts` with a named `publicationWorkspaceConfig` export.

### `template validate`

Validate a portable template before you import or publish it:

```bash
bunx @citadelfoundation/kit-publishing template validate <source> [--subdir <path>]
```

This checks the portable manifest, required workspace files, and dependency shape.

### `--help`

```bash
bunx @citadelfoundation/kit-publishing --help
bunx @citadelfoundation/kit-publishing create --help
bunx @citadelfoundation/kit-publishing studio --help
bunx @citadelfoundation/kit-publishing template validate --help
```

## Built-in templates

The package bundles three built-in templates as plain Astro workspaces:

### `blank`

A minimal site with the homepage, docs route, blog route, and the canonical publishing content directories, but no seeded docs or editorial content.

### `starter`

A balanced starting point with one docs section, one docs page, and one sample post.

### `publication`

A more opinionated editorial shape with a richer homepage, multiple docs pages, and a seeded blog.

## Portable template contract

Portable templates use `kit-publishing.template.json` at the template root. Required fields:

- `id`
- `label`
- `summary`
- `audience`
- `screenshot`
- `supportedDeployPresets`
- `kitPublishingVersion`

Portable templates are normal Astro site directories. They must not depend on internal-only `@citadelfoundation/kit-template-*` packages or contain `workspace:` or `file:` refs.

`supportedDeployPresets` must use kit-supported preset ids only and must always include `none` for the local-first path.

## Catalog

The built-in gallery data is exported from:

- `@citadelfoundation/kit-publishing/catalog`

That catalog includes:

- manifest metadata for the built-in templates
- `createCommand`
- `runCommand`
- `deployCtas`
- inline `screenshotDataUrl`

Consumer sites can render the built-in gallery directly from that export without duplicating template metadata locally.

## Deploy preset

Cloudflare Pages is the only supported alpha preset:

```bash
bunx @citadelfoundation/kit-publishing create my-site --template starter --deploy cloudflare-pages
```

The preset writes local deployment scaffolding such as `wrangler.toml`. It does not add hosted onboarding or change the local-first publishing workflow.

## Library usage

Public entry points:

- `@citadelfoundation/kit-publishing`
- `@citadelfoundation/kit-publishing/content`
- `@citadelfoundation/kit-publishing/server`
- `@citadelfoundation/kit-publishing/studio`
- `@citadelfoundation/kit-publishing/astro`
- `@citadelfoundation/kit-publishing/types`
- `@citadelfoundation/kit-publishing/catalog`

### Astro loaders

```ts
import { loadAstroPublishingSnapshot } from "@citadelfoundation/kit-publishing/astro";

const snapshot = await loadAstroPublishingSnapshot(process.cwd());
if (!snapshot.success) {
  throw new Error(snapshot.error.reason);
}
```

### Local studio host

```ts
import { startPublishingStudioHost } from "@citadelfoundation/kit-publishing/studio";

const host = await startPublishingStudioHost({ root: process.cwd() });
if (!host.success) {
  throw new Error(host.error.reason);
}
```

### Workspace config type

```ts
import type { PublicationWorkspaceConfig } from "@citadelfoundation/kit-publishing";

export const publicationWorkspaceConfig: PublicationWorkspaceConfig = {
  title: "My Site",
};
```

The package also supports standalone export and vendored-consumer validation flows. Those exports carry provenance metadata and are intended to remain generated artifacts, not a second long-lived implementation surface.

Keep consumer-specific overlays outside the generated package tree, for example:

- `publication.config.ts`
- `publication.policy.ts`
- `content/**`
- repo-owned boot, test, and CI wiring

## Typecheck verification

Use the verification command that matches the package context:

- Generated or imported site workspace:

  ```bash
  bun run check
  ```

- Standalone exported package copy:

  ```bash
  bun run typecheck
  ```

Prefer Bun-native verification commands inside generated sites or exported copies so validation stays scoped to the package or site you are checking.
