# Public Release Workflow

This repository contains generated public release artifacts only.

## Branches

- `main` is the stable public distribution branch.
- `promote/*` is the public review lane for updates to `main`.
- `release/kit-publishing-*` is the public publish lane for `@citadelfoundation/kit-publishing`.

## Publishing

Publishing is performed from `release/kit-publishing-*` branches through the generated GitHub Actions workflow at `.github/workflows/publish-kit-publishing.yml`.
That workflow provisions Node.js 24 and verifies `npm --version` as 11.x before any publish-path npm command so npm trusted publishing runs with an OIDC-capable CLI.

The trusted-publishing relationship must remain attached to:

- repository: `CitadelFoundation/kit`
- workflow file: `publish-kit-publishing.yml`
- package: `@citadelfoundation/kit-publishing`

Do not add source files, tests, or exploratory refs to this repository.

Do not promote private operational directories such as `.codex/`. The public repo template ignores `.codex/`, and the public-tree audit treats any `.codex/` path as a release-blocking leak.
