## What changed

<!-- One feature per PR. What a player or tester will notice. -->

## Checklist

- [ ] Merged the latest `main` into this branch
- [ ] New art and data use IDs from [docs/ID-REGISTRY.md](../docs/ID-REGISTRY.md) (rules: [docs/NAMING.md](../docs/NAMING.md))
- [ ] Ran `node tools/build-asset-manifest.mjs && node tools/build-id-registry.mjs`
- [ ] `node --test tests/*.cjs` passes
- [ ] Checked in the browser (`python3 -m http.server`): solo, and co-op if combat changed
