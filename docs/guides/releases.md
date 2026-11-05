# Releases

Every published package is released at one version, with one tag such as `v1.0.0`. The workflow `release.yml` does it, and only when you start it. [Decision 01](../decisions/01-repository-tooling-and-releases.md#releases) holds the rules.

## What the workflow does

1. Runs `pnpm verify` on `main`.
2. `nx release version` sets the version in every published package and in their internal dependencies.
3. `nx release changelog` writes `CHANGELOG.md` from the Conventional Commits, commits it with the versions as `chore(release): publish <version>`, tags the commit, pushes both to `main` and creates the GitHub Release.
4. `nx release publish` publishes the packages to npmjs.com with provenance.

A dry run, the default, does steps 1 and 2 on the runner only, prints the changelog and packs every package without publishing. It changes nothing in the repository or on npm.

## Releasing

1. Check that `main` is green and that the pull requests of the release are merged.
2. In GitHub, open Actions → Release → Run workflow, on `main`.
3. Leave the version empty to derive it from the commits since the last tag, or enter it, such as `1.0.0`. The first release always needs `1.0.0`, since without a tag the version would start at 0.0.1.
4. Keep "dry run" on and run it. Read the version, the changelog and the list of files of each package in the log.
5. Run it again with "dry run" off.
6. Check the GitHub Release and the packages on npmjs.com.

## Requirements

- The secret `NPM_TOKEN` holds an npm token that can publish to the scope `@mszczygiel-projects`.
- The workflow pushes the release commit and the tag to `main`. A branch protection rule on `main` has to let `github-actions[bot]` push.

## When it fails

- **Before publishing:** nothing is pushed until the changelog step, so fix the cause and run the workflow again.
- **After the tag, before publishing:** the release commit and the tag are on `main`, but nothing is on npm. Delete the GitHub Release and the tag, revert the release commit in a pull request, fix the cause and release again.
- **A published version is wrong:** npm never accepts the same version twice. Fix it in a new patch release, and deprecate the wrong one with `npm deprecate`.
