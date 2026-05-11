# Releasing

Only `@loupe/dev-annotator` is published to npm. `@loupe/core` is marked `private`
and `@loupe/extension` is published via Chrome Web Store (separate process).

## One-time setup

1. **npm scope** — `@loupe` must exist on npm and your account must be a member:
   ```bash
   npm login
   npm org create loupe       # if it doesn't exist yet
   # or have the owner invite you: npm team add loupe:developers <user>
   ```
2. **2FA** — enable auth-and-writes 2FA on the npm account if not already.

## Cutting a release

From a clean `main`:

```bash
# 1. Bump version (edit packages/dev-annotator/package.json by hand,
#    or use pnpm version — but in a workspace it's simpler manually)

# 2. Update CHANGELOG.md — move "Unreleased" notes under the new version.

# 3. Build + test
pnpm install
pnpm --filter @loupe/core test          # 15+ unit tests must pass
pnpm --filter @loupe/dev-annotator build
pnpm --filter @loupe/extension exec tsc --noEmit   # ensure consumers still typecheck

# 4. Commit + tag
git add -A
git commit -m "release: v<X.Y.Z>"
git tag v<X.Y.Z>
git push origin main --tags

# 5. GitHub release (auto-generates notes from commits + tag diff)
gh release create v<X.Y.Z> --generate-notes

# 6. Publish to npm
cd packages/dev-annotator
npm publish     # publishConfig.access is "public" — scoped pkg needs this
```

## Verifying

```bash
npm view @loupe/dev-annotator versions
# should list <X.Y.Z>

# Smoke-test a fresh install:
mkdir /tmp/loupe-smoke && cd /tmp/loupe-smoke
npm init -y && npm i -D @loupe/dev-annotator react react-dom
node -e "console.log(require('@loupe/dev-annotator'))"
```

## Notes on what NOT to publish

- `@loupe/core` is `private: true`. `npm publish` from that directory will refuse —
  good. It's an internal package; its source is bundled into `@loupe/dev-annotator`
  via tsup's `noExternal: [/.*/]`.
- `@loupe/extension` is `private: true`. The store-ready ZIP is produced via the
  extension build, not via npm.
- Examples (`examples/electron-app`, `examples/devtools-snippet`) are not packages.

## If you need to unpublish

You have **72 hours** to `npm unpublish @loupe/dev-annotator@X.Y.Z` (npm policy).
After that, only `npm deprecate` is available. Plan first, publish second.
