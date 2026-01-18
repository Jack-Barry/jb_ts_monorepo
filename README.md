# Jack Barry's TS Monorepo Example

## Goals

**TL;DR** When working in a monorepo, I want to have proper IDE support in my test
files and be able to see references to values that cross package boundaries so that
refactoring is easy-peasy.

- IDE support for various environments, such as separation between
  `src` and `tests` global types and preventing imports from `tests` into `src`
- IDE support for refactoring of values exported by NPM workspace packages and consumed
  by other packages in the repo

**NOTE** This project only uses `tsc` for building, but the aim of this setup is
not to limit one to using `tsc` to transpile their code. The main aims of this
are to enhance IDE support when working in a monorepo, leveraging TS
configuration to feed LSPs.

## Structure

```none
.
├── apps
│   └── app_a
│       ├── package.json
│       ├── src
│       │   ├── index.ts
│       │   └── tsconfig.json
│       ├── tests
│       │   ├── index.test.ts
│       │   └── tsconfig.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── package.json
├── packages
│   └── package_a
│       ├── package.json
│       ├── src
│       │   ├── index.ts
│       │   └── tsconfig.json
│       ├── tests
│       │   ├── index.test.ts
│       │   └── tsconfig.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── tsconfig.build.json
└── tsconfig.json
```

In this setup, `apps` are applications that would be expected to consume `packages`.

Starting from the root:

- We have a `tsconfig.json` that is used by your IDE of choice to feed the LSP and
  support useful things like "go to definition."
- We have a `tsconfig.build.json` that is used to run `tsc` from the root of the
  project to build type declarations. This makes it ergonomic to run a watcher
  in the background that compiles types, so that say, `apps/app_a` has access to
  the type declarations for imports from `packages/package_a`.
- In `package.json`, we specify our `workspaces` to let NPM/Node understand how
  to resolve imports from things we build in `packages`.

In `tsconfig.json`, some important settings include:

- `include` Should include things you want to have IDE support for, e.g.
  everything in `apps` and `packages`
- `compilerOptions.sourceMap`, `compilerOptions.declaration` and `compilerOptions.declarationMap`
  all set to `true`. These help in situations where you want to navigate from a value
  in `apps` to its corresponding source code in `packages`.

In `tsconfig.build.json`, we basically tell it:

- Don't include any `files` or `include` anything for that matter. We'll specify
  what we _actually_ want to build by using `references`, which will point to
  other `tsconfig.json` files to do the evil bidding.
- The `path` values in `references` point to `src` folders specifically. This is
  because when running it in watch mode, there's not much point in transpiling
  types from `tests` folders, since we wouldn't anticipate importing anything from
  those and thus do not actually need their declarations on disk.
  - Order of these is intentional, we want to build `packages` _before_ `apps`

Moving on to what we do in `packages`:

- Our `packages/package_a/tsconfig.json` is mostly a pass-through.
  - It `extends` our base TS options that we have configured in the root `tsconfig.json`.
  - We tell it not to actually generate anything at this level using `noEmit`, since
    we'll delegate that responsibility to `packages/package_a/src/tsconfig.json`.
  - We also specify that both `src` and `tests` reference this package-level `tsconfig.json`.
- The `src/tsconfig.json` is what we use to emit type declarations for this
  package.
  - `composite` must be `true` since this config references the one in the
    parent directory
  - `rootDir` is set to the `src` directory itself
  - `outDir` points to `packages/package_a/dist`
  - `include` is also set to the `src` directory, so that we are not allowed to
    import things from relative paths outside of it
  - For this example, we specify that `types` includes `node`, with the implication
    being that this package is intended to run in a Node environment.
- In `package.json`
  - We need to specify where `types` are expected to be found, in this case the `dist`
    folder specified by `src/tsconfig.json`
  - The `build` script specifies that `tsc` should build `src`
- The `tests/tsconfig.json` is what we use to ensure that we can use `src` things
  in `tests`, as well as get proper IDE support for things like test globals
  - Similar to `src`, `composite` must be `true` since this config references the
    one in the parent directory
  - `rootDir` is set to the parent directory so that we have access to `src`
  - `outDir` points to `packages/package_a/.compiled`. This is so that if we
    were to publish the contents of `dist`, it would not include type
    declarations emitted from the `tests` dir. Note that `.compiled` could be
    any dir name you want.
  - `include` is set to include both the `src` directory and the `tests` directory
    so that we _are_ allowed to import things from relative paths in `src`
  - For this example, we specify that `types` includes `node` _and_ `vitest/globals`,
    with the implication being that contents of `tests` are intended to run in a
    Node environment with Vitest's globals enabled.

Finally, that brings us to `apps`, which will have some similarities with `packages`:

- The `apps/app_a/tsconfig.json` is mostly pass-through
- `apps/app_a/src/tsconfig.json` specifies how the app types get emitted
- `apps/app_a/package.json` is a little simpler, since we are not exporting anything
  for consumption elsewhere
- `apps/app_a/tests/tsconfig.json` is nearly identical to the one for
`packages/package_a/tests`,
  for all the same reasons.

## Getting the Most Out of Your IDE

If you were to pull this repo down and start trying to hack away in `apps`,
you'd get errors complaining about missing types for `@jb_ts_monorepo/package_a`.
This is because the `dist` folder hasn't been generated on disk yet, so things
in `apps` can't refer to the emitted types. For this reason, a script in the
root `package.json` can be run while developing to keep things in sync:

```shell
npm run compile:watch
```

This will ensure that if you change things in `packages`, types get re-emitted
and your IDE will be able to understand how those changes may affect things in
`apps`.

### Example Benefits

- You can go into `packages/package_a/src/index.ts` and ask to see references to
  the exported `superCool` value. Note how it includes usage of the variable
  found in `apps/app_a`.
  - This will work even if you haven't opened files in `apps/app_a` yet, which
    is much more ergonomic than expecting you to have opened things all around
    your monorepo every time you want to rename something coming from a shared
    package.
- Similarly, if you use your IDE to rename the `superCool` constant, that name change
  will propagate to all references to it, including those found in `apps/app_a`
- When working in `apps/app_a`, if you want to go to the definition for
  `superCool`, it will take you to `packages/package_a/src/index.ts`, vs. taking
  you to the declaration file instead (which is usually not what you'd actually
  want to see for a package in the same repo).
- In either of the `src` folders, you do _not_ have access to test globals nor anything
  exported by `tests`. This prevents pollution of your source code with unintended
  test constructs.
