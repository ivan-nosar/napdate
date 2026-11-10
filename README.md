# napdate

Update top-level npm dependencies to the latest published versions.
Requires Node.js 24 or later.

```sh
npx napdate npm [LOCATION] [OPTIONS]
```

`npm` is case insensitive. `LOCATION` defaults to the current directory and
may be a directory containing `package.json` or the file itself. The manifest
must be a JSON object with a `dependencies` object; `devDependencies` and
`optionalDependencies`, if present, must also be objects mapping package names
to version strings.

```sh
npx napdate --help
npx napdate npm --help
npx napdate npm ./my-project --dry-run --concurrent 4
npx napdate npm ./my-project/package.json --no-dev --no-optional
```

| Option | Description |
| --- | --- |
| `-h`, `--help` | Show generic or npm-specific help |
| `-d`, `--dry-run` | Print `"package": old -> new;` without changing the manifest |
| `-c`, `--concurrent` | Concurrent registry requests, an integer from 1 to 100 (default 8) |
| `--no-deps` | Skip `dependencies` |
| `--no-dev` | Skip `devDependencies` |
| `--no-optional` | Skip `optionalDependencies` |

All selected packages are resolved before any changes are written. Registry
errors leave the manifest unchanged. Other manifest fields are preserved.

## Initial limitations

- Peer dependency conflicts are not resolved; only top-level dependency
  sections are updated.
- Only the public npm registry is used; custom registries are ignored.
- Existing semver ranges and other version notation are replaced with pinned
  versions (without `^`, `~`, `>=`, and so on).
- Lockfiles are not updated. Run your package manager afterward to synchronize
  the lockfile and installed packages.

See [CONTRIBUTE.md](CONTRIBUTE.md) for development and release instructions.
