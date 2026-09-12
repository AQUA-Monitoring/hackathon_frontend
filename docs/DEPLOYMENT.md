# Aqua frontend releases

The official site is `https://aqua.michalski.app`; beta is
`https://beta-aqua.michalski.app`. Both use the existing
`https://api-aqua.michalski.app/api/` backend and production data. Browser storage
and sessions remain isolated by origin. Beta is public and uses normal Aqua login.

## Source and publication

The repositories were synchronized at `c29541aad95566a168c536b386ab78208169379e`
on 2026-09-12. Future code promotion is explicit; repositories are not mirrored.

- `AQUA-Monitoring/aqua_beta`: push to `dev` runs quality, builds
  `ghcr.io/aqua-monitoring/aqua-beta:<sha>`, and deploys if activation is enabled.
- `AQUA-Monitoring/aqua_frontend`: manually run **Aqua frontend release**,
  supplying a full `release_ref` reachable from `dev`. Image:
  `ghcr.io/aqua-monitoring/aqua-frontend:<sha>`.
- The workflow is also registered on `main` solely for GitHub's manual-dispatch
  requirement. Application source is always selected from `dev`; this does not
  promote application code to `main`.
- Runtime always uses the returned image digest, not the mutable SHA tag.
- `/release.json` reports the served source SHA; `/health` reports nginx health.

## Repository configuration

Variables: `VITE_BASE_URL=https://api-aqua.michalski.app/api/`,
`AQUA_DEPLOY_HOST` (SSH host reachable from GitHub-hosted runners),
`AQUA_DEPLOY_PORT` (defaults to 22), `AQUA_DEPLOY_ENABLED` (initially `false`).
Secrets: `VITE_MAPBOX_API_KEY`, `AQUA_DEPLOY_SSH_KEY`,
`AQUA_DEPLOY_KNOWN_HOSTS`. Pin the host key from the server's public host key;
do not trust an unverified `ssh-keyscan` result. Never reuse the old Dokku key.

Other `VITE_*` options in the Dockerfile are passed through when configured.
Values embedded by Vite are public browser configuration. Never put backend
credentials in a `VITE_*` variable. Push subscriptions obtain their VAPID key
through the existing backend flow.

The deploy command consumes a transient job token over SSH stdin for registry
pull and GitHub run validation. It discards the Docker auth directory afterward.
Each key is constrained to one fixed channel, with no general shell or forwarding.
The server rejects stale beta SHAs and older workflow sequence numbers.

## Activation and rollback

Before enabling deploy, install the reviewed server-management
`scripts/install-aqua-deploy` command, configure both restricted keys, and validate
local services and Cloudflare routes. `AQUA_DEPLOY_ENABLED=false` still builds and
publishes a release artifact; it never deploys.

A failed local healthcheck restores the prior managed release. A first failed
release is stopped, preserving the legacy service. If restoration fails or a
deploy is interrupted, the pending marker blocks further CI deployment until an
operator recovers it. Records live under `/var/lib/aqua-deploy/<channel>/`.
Keep previous images, manifests, and the legacy service for at least seven days.
The backend, its volumes and migrations are outside this frontend release flow.
