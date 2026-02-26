# Backend tagging and versioning (GitHub Releases)

Releases are driven by **backend version tags** (`api-v*`, e.g. `api-v1.0.0`). The workflow **[.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml)** lives in this folder and runs: lint, test, build, then creates a **GitHub Release** with the built `dist/` artifact.

**To run this workflow on GitHub:** GitHub Actions only runs workflows from the **repo root** `.github/workflows/`. So if your repo root is the parent of `fastify_backend`, copy this workflow there once:

```bash
# From repo root
mkdir -p .github/workflows
cp fastify_backend/.github/workflows/deploy-backend.yml .github/workflows/
git add .github/workflows/deploy-backend.yml
git commit -m "chore: add backend release workflow at root for GitHub Actions"
git push
```

After that, pushing a tag like `api-v1.0.0` will trigger the release. If you change the workflow later, update the copy at root too.

---

## Version format

- **Tag pattern:** `api-v<major>.<minor>.<patch>` (e.g. `api-v1.0.0`, `api-v2.1.3`).
- **Semantic versioning:** patch = bug fixes, minor = new features (backward compatible), major = breaking changes.
- Using `api-v*` keeps backend releases separate from frontend tags (e.g. `v*` for UI).

---

## Release steps

### 1. Bump version in package.json

From the **fastify_backend** directory:

```bash
cd fastify_backend

npm run version:patch   # 1.0.0 → 1.0.1
# or
npm run version:minor   # 1.0.0 → 1.1.0
# or
npm run version:major   # 1.0.0 → 2.0.0
```

This only updates `package.json` (no git tag is created).

### 2. Commit the version bump

```bash
git add fastify_backend/package.json
git commit -m "chore(backend): release api-v1.0.1"
```

### 3. Create and push the tag (triggers the workflow)

Tag name must match **api-v** + the new version in package.json:

```bash
# Example: after bumping to 1.0.1
git tag api-v1.0.1
git push origin api-v1.0.1
```

Or in one go:

```bash
git push origin main --tags
```

Pushing the tag triggers the **Deploy Backend** workflow: lint → test → build → GitHub Release with `dist/` attached.

### 4. Verify the release

- **Actions:** GitHub → **Actions** → **Deploy Backend** (run for your tag).
- **Releases:** GitHub → **Releases** → new entry **Backend api-v1.0.1** with generated notes and `dist/` files.

---

## Quick reference

| Step              | Command |
|-------------------|--------|
| Bump patch        | `cd fastify_backend && npm run version:patch` |
| Bump minor/major  | `npm run version:minor` / `version:major` |
| Commit            | `git add fastify_backend/package.json && git commit -m "chore(backend): release api-vX.Y.Z"` |
| Tag & push        | `git tag api-vX.Y.Z && git push origin api-vX.Y.Z` |

---

## Notes

- The workflow file lives only in **fastify_backend**. To have GitHub run it, copy it to repo root `.github/workflows/` (see note above). The job uses `working-directory: fastify_backend` for all steps.
- To release an existing commit: `git tag api-v1.0.1 <commit-hash>` then `git push origin api-v1.0.1`.
- Pre-release tags (e.g. `api-v2.0.0-beta.1`) also match `api-v*` and will create a release.
- Render (or other deploy) is independent: configure it to deploy from a branch or from a release artifact as needed.
