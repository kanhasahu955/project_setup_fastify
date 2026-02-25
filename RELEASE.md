# Releasing the Backend (Git tags & GitHub Releases)

Releases are created automatically when you push a **version tag** (`v*`, e.g. `v1.0.0`). The [Deploy workflow](.github/workflows/deploy.yml) runs: lint, test, build, then creates a **GitHub Release** with the built `dist/` artifact.

## Release steps

1. **Bump version** (updates `package.json` only):

   ```bash
   npm run version:patch   # 1.0.0 → 1.0.1
   # or
   npm run version:minor   # 1.0.0 → 1.1.0
   # or
   npm run version:major   # 1.0.0 → 2.0.0
   ```

2. **Commit the bump:**

   ```bash
   git add package.json
   git commit -m "chore: release v1.0.1"
   ```

3. **Push to main** (optional, for CI):

   ```bash
   git push origin main
   ```

4. **Create and push the tag** (triggers the workflow and GitHub Release):

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   # or:  git push origin main --tags
   ```

5. **Check the release**  
   On GitHub: **Releases** → new release for the tag with generated notes and the `dist/` artifact.

## Notes

- Tag names must match `v*` (e.g. `v1.0.0`, `v2.0.0-beta.1`).
- If this repo is a monorepo with the frontend, use a different tag prefix for the backend (e.g. `api-v1.0.0`) and change the deploy workflow `on.push.tags` to `api-v*`.
