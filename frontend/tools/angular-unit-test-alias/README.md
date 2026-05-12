# `@ethereal/angular-unit-test-alias`

Local Architect builder that **wraps** `@angular/build:unit-test`. The app and library `angular.json` test targets use this package instead of calling `@angular/build:unit-test` directly.

## Why it exists

1. **IntelliJ / IDE Vitest integration** — IDEs often pass a `config` option (Vitest config path). Angular’s unit-test schema does not allow that property (`additionalProperties: false`), so validation fails. This builder strips `config` before delegating to Angular.

2. **Absolute `include` paths** — Some runners pass absolute file paths in `include`. Angular expects globs relative to the frontend project root. The builder normalizes those paths.

3. **Multi-project workspace** — With both `EE` and `ethereal-ui` in one `angular.json`, running only app specs (or only library specs) should not force the other project’s test target to run a mismatched include set. The builder **no-ops** the target when its `include` patterns clearly belong to the other project.

4. **Vitest V8 coverage** — `@angular/build` currently sets `coverage.excludeAfterRemap: true` for Vitest v8, which in this setup yields an **empty** coverage report. Until that changes upstream, the builder rewrites that flag when Node first loads Angular’s Vitest plugins module (no committed patch on `node_modules`).

## Files

- `unit-test.cjs` — implementation (CommonJS so Architect can load it reliably).
- `builders.json` — registers the `unit-test` builder.
- `schema.json` — same surface as Angular’s unit-test schema, plus the optional `config` field for IDE compatibility.

## Replacing it

You can switch `angular.json` to `"builder": "@angular/build:unit-test"` and remove this package **if** you accept losing the behaviors above (and fix IDE/run configs accordingly).
