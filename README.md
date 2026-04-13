# Citadel Foundation Kit Public Distribution

This repository is the public distribution surface for approved `@citadelfoundation/kit-*` release artifacts.

It is generated from the private source-of-truth repository `CitadelFoundation/kit-stage`.

Public refs are intentionally limited:

- `main`
- `promote/*`
- `release/<lane>-*` (for governed publishable lanes)

This repository is not the place for feature development, exploratory branches, or source review of the private workspace.

Private operational state from the source repo, including `.codex/`, must not be promoted here and is ignored in the public distribution repo template.

The currently governed publishable lanes are:

- `@citadelfoundation/kit-publishing`
- `@citadelfoundation/kit-ui`

The supported public workflow is:

1. prepare and validate a release branch in the private source repo
2. export the approved public distribution tree for the target lane
3. promote generated artifacts to `promote/*` or `release/<lane>-*`
4. publish from the public distribution repo through GitHub Actions trusted publishing
