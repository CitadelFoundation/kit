# @citadelfoundation/kit-publishing

`@citadelfoundation/kit-publishing` is a Git-native, local-first publishing toolkit for Astro sites, local studio workflows, and static deployment targets such as Cloudflare Pages.

## Scope

- File-backed content and publish primitives
- Local-only Elysia API for drafts, preview, publish, and AI assists
- `@citadelfoundation/kit-ui`-native studio shell, themed Storybook states, and markdown-first editor surface
- Astro-facing loaders for site, blog, and docs routes

## Canonical content layout

```text
content/
├── site/
│   ├── site_settings.json
│   ├── navigation.json
│   └── homepage.json
├── posts/
│   └── hello-world.mdx
├── docs/
│   ├── pages/
│   │   └── getting-started/index.mdx
│   └── sections/
│       └── getting-started.json
└── media/
```

Drafts are kept outside canonical content in `.studio/drafts/`.

## Entry points

- `@citadelfoundation/kit-publishing/content`
- `@citadelfoundation/kit-publishing/server`
- `@citadelfoundation/kit-publishing/studio`
- `@citadelfoundation/kit-publishing/astro`
- `@citadelfoundation/kit-publishing/types`

## Published package contract

Phase 2 and Phase 3 consumers should install the published npm artifact directly:

```bash
bun add --exact @citadelfoundation/kit-publishing@0.1.1
```

The supported downstream contract is the published package plus the approved entry points listed above. Do not use vendored source copies or sibling workspace wiring as a steady-state integration path.

## Release lane

The first public npm publish stays on the checked-in `0.1.0` manifest baseline and must be bootstrapped once from a clean local checkout on the `release/kit-publishing-0.1.0` branch:

```bash
CI=true npm publish -w @citadelfoundation/kit-publishing --access public
```

Immediately after the first publish succeeds, attach the GitHub trusted publisher for subsequent releases:

```bash
npm trust github @citadelfoundation/kit-publishing --repo CitadelFoundation/kit --file publish-kit-publishing.yml
```

After `@citadelfoundation/kit-publishing` exists on npm, later releases use the private-source and public-distribution flow:

1. validate and version a release branch in the private `CitadelFoundation/kit-stage` source repo
2. export a clean public distribution tree
3. promote generated artifacts to `CitadelFoundation/kit` on `release/kit-publishing-*`
4. run the generated public-repo `publish-kit-publishing.yml` workflow

The steady-state workflow upgrades the public GitHub Actions runner to `npm@^11.5.1`, logs `npm --version`, and then uses npm trusted publishing through GitHub OIDC. It must remain registered with npm for `@citadelfoundation/kit-publishing` on `CitadelFoundation/kit`. Local publish remains blocked by `scripts/publish_guard.mjs` outside the one-time bootstrap command above.

## Storybook

The package ships Storybook stories for reusable studio components and workflow states, using the shared `@citadelfoundation/kit-ui` theme decorator patterns instead of a standalone publishing-only preview setup:

```bash
bun --cwd packages/publishing run storybook
```

Story ownership is intentionally split:

- `storybook/stories/publishing_studio.stories.ts` owns named Ghost-style shell and workflow baseline states.
- `storybook/stories/publishing_editor_surface.stories.ts` owns component-support editor surface states.
- `storybook/stories/publishing_editor_engine_comparison.stories.ts` owns decision-only editor comparison artifacts.

Storybook states are baseline artifacts, not final parity sign-off. For Ghost-style browse, shell,
overlay, and metadata-drawer parity, keep using the integrated browser host plus the acceptance
evidence in `.taskmaster/docs/kit-publishing-ghost-acceptance-evidence.md` and
`.taskmaster/docs/kit-publishing-ghost-source-ownership.md`.

## Local studio host

Start the private studio host against any publishing workspace root:

```bash
bun --cwd packages/publishing run studio:dev -- --root /absolute/path/to/workspace
```

The host bundles the browser client on startup, serves the `@citadelfoundation/kit-ui` studio shell, and mounts the embedded Elysia API at `/api`.

The default studio workflow is preview-first and diff-reviewed:

1. edit body and metadata in the local studio
2. preview the rendered draft
3. review the canonical diff
4. confirm publish to write Git-tracked files

## Legacy standalone export

`export:standalone` remains available for internal source-authority debugging only:

```bash
bun --cwd packages/publishing run export:standalone
```

The export is written to `packages/publishing/dist/standalone/`, but it is not a supported consumer contract for the Phase 2 release lane. Downstream steady-state integrations should use the published npm package instead.

## Typecheck verification

Use the verification command that matches the package context:

- Workspace package gate from the `projects/kit` repo root:

  ```bash
  moon run kit-publishing:typecheck
  ```

- Internal standalone debug bundle gate from the exported package root inside `dist/standalone/`:

  ```bash
  bun run typecheck
  ```

Do not treat `moon run :typecheck` from inside `dist/standalone/` as standalone verification. Because the export may live under another parent workspace, Moon can rebind to that parent workspace and validate unrelated projects instead of the exported package itself.
