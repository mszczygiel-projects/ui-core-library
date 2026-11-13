# Releases

Every published package is released at one version, with one tag such as `v1.0.0` or, for a pre-release, `v1.0.0-alpha.0`. The workflow `release.yml` does it, and only when you start it. [Decision 01](../decisions/01-repository-tooling-and-releases.md#releases) holds the rules.

## What the workflow does

1. Runs `pnpm verify` on `main`.
2. `nx release version` sets the version in every published package and in their internal dependencies.
3. `nx release changelog` tags the current commit of `main`, pushes the tag and creates the GitHub Release, whose notes are the changelog written from the Conventional Commits.
4. `nx release publish` publishes the packages to npmjs.com with provenance. A pre-release goes under the dist-tag of its identifier (`alpha`, `beta` or `rc`), a stable version under `latest`.

A dry run, the default, does steps 1 and 2 on the runner only, prints the changelog and packs every package without publishing. It changes nothing in the repository or on npm.

## Releasing

1. Check that `main` is green and that the pull requests of the release are merged.
2. In GitHub, open Actions → Release → Run workflow, on `main`.
3. Leave the version empty to derive a stable version from the commits since the last tag, or enter it, such as `1.0.0`. Enter it always for the first release, since without a tag the version would start at 0.0.1, and for every pre-release, such as `1.0.0-alpha.0` and then `1.0.0-alpha.1`. The workflow refuses an empty version when the last tag is a pre-release.
4. Keep "dry run" on and run it. Read the version, the changelog and the list of files of each package in the log.
5. Run it again with "dry run" off.
6. Check the GitHub Release and the packages on npmjs.com. After the first publication of a package, run `npm dist-tag ls <package>`. A pre-release must not be under `latest`; if it is, remove it with `npm dist-tag rm <package> latest`.

## Using a pre-release

Install it by its tag or its exact version, and pin the exact version in the consumer, because a range such as `^1.0.0-alpha.0` also accepts later alphas.

```bash
npm install @mszczygiel-projects/ui-core-react@1.0.0-alpha.0 --save-exact
```

Move from alpha to beta when the set of components is complete, and to rc when only bug fixes remain. Each move is the next version with the new identifier, such as `1.0.0-beta.0`.

## Requirements

- The secret `NPM_TOKEN` holds an npm token that can publish to the scope `@mszczygiel-projects`.
- The workflow pushes only the tag. The versions in the `package.json` files of the repository stay `0.0.0`, and the next release reads the current version from the last tag. So the ruleset on `main`, which accepts changes only through pull requests, needs no exception.

## When it fails

- **Before the tag:** nothing has left the runner, so fix the cause and run the workflow again.
- **After the tag, before publishing:** the tag and the GitHub Release exist, but nothing is on npm. Delete both, fix the cause and release again.
- **A published version is wrong:** npm never accepts the same version twice. Fix it in a new patch release, and deprecate the wrong one with `npm deprecate`.
