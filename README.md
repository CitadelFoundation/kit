# Citadel Foundation Kit Public Distribution

This repository is the public distribution surface for approved `@citadelfoundation/kit-*` release artifacts.

It is generated from the private source-of-truth repository `CitadelFoundation/kit-stage`.

Public refs are intentionally limited:

- `main`
- `promote/*`
- `release/kit-publishing-*`

This repository is not the place for feature development, exploratory branches, or source review of the private workspace.

Private operational state from the source repo, including `.codex/`, must not be promoted here and is ignored in the public distribution repo template.

Phase 2 currently promotes one public package:

- `@citadelfoundation/kit-publishing`

The supported public workflow is:

1. prepare and validate a release branch in the private source repo
2. export the approved public distribution tree
3. promote generated artifacts to `promote/*` or `release/kit-publishing-*`
4. publish from the public distribution repo through GitHub Actions trusted publishing
