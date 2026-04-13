# Public Release Workflow

This repository contains generated public release artifacts only.

## Branches

- `main` is the stable public distribution branch.
- `promote/*` is the public review lane for updates to `main`.
- `release/<lane>-*` is the publish lane for governed packages.

## Publishing

Publishing is performed from `release/<lane>-*` branches through the generated lane-specific GitHub Actions workflow.
Each governed publishable lane has its own workflow file under `.github/workflows/`.

The trusted-publishing relationship must remain attached per package:

- repository: `CitadelFoundation/kit`
- package-specific workflow file and package name

Do not add source files, tests, or exploratory refs to this repository.

Do not promote private operational directories such as `.codex/`. The public repo template ignores `.codex/`, and the public-tree audit treats any `.codex/` path as a release-blocking leak.
