# Contributing

Install Node.js 24 and run:

```sh
npm ci
npm test
```

`npm run build` compiles the CLI into `dist/`. `npm run test:unit` runs unit
tests with 100% line, branch, and function coverage enforced and writes
`coverage/lcov.info`. `npm run test:e2e` runs the built CLI in temporary
projects with a mocked public registry. Run the build before either test command.
CI uploads the coverage report as an artifact.

## Publishing

Before enabling releases, ensure the npm package name `napdate` is available
or owned by the publishing account. Create a GitHub environment named
`npm-publish`, configure any required reviewers and tag protections, and add
an environment secret named `NPM_TOKEN` containing an npm granular access token
authorized to publish this package (including any required 2FA bypass for
automation). Never commit the token. Only trusted maintainers should be allowed
to create release tags and approve the publishing environment.

Update the version in `package.json` and `package-lock.json` together with
`npm version <version> --no-git-tag-version`, run `npm test`, and merge the
release commit. Create and push a matching `v<version>` tag pointing at that
commit through your normal GitHub release process. The publish workflow runs
only on pushed `v*` tags, tests the tagged commit, verifies that its tag matches
the package version, and publishes to the public npm registry. Each npm version
must be new. For a local package preview, run `npm pack --dry-run` after building.
