# Production port exposure — requirements for the reverse proxy step

Not implemented yet — this only documents what's needed once a reverse
proxy (nginx, Caddy, Traefik, ...) is actually placed in front on the VPS.
No proxy config is added by this document.

## Current state (docker-compose.yml)

| Service  | Port mapping          | Reachable from                                                   |
| -------- | --------------------- | ---------------------------------------------------------------- |
| postgres | `127.0.0.1:5432:5432` | VPS host only (already fixed — see the audit's Postgres section) |
| web      | `3000:3000`           | Public internet (0.0.0.0)                                        |
| ws       | `8080:8080`           | Public internet (0.0.0.0)                                        |

## Target state once a reverse proxy exists

Only the proxy should bind `0.0.0.0:80` and `0.0.0.0:443`. Change `web` and
`ws` in docker-compose.yml to `127.0.0.1:3000:3000` and
`127.0.0.1:8080:8080` (loopback-only, same pattern already used for
postgres), so they're reachable from the proxy process on the same host
but not directly from the internet. The proxy then:

- Terminates TLS (real cert — see the domain/HTTPS step, not part of this
  audit) and forwards `/` traffic to `127.0.0.1:3000`.
- Forwards WebSocket traffic to `127.0.0.1:8080`, with the proxy's
  WebSocket-upgrade handling enabled (`Upgrade`/`Connection` headers passed
  through — nginx needs `proxy_set_header Upgrade $http_upgrade;` and
  `proxy_set_header Connection "upgrade";` explicitly, it isn't automatic).
- Sets `X-Forwarded-For`/`X-Real-IP` itself and strips any client-supplied
  copy of those headers before forwarding — this is also the point at
  which `TRUST_PROXY_HEADERS=true` becomes safe to set (see
  `lib/security/client-ip.ts` and `.env.example`); flipping it on without
  a proxy that actually overwrites these headers would let any client
  claim to be any IP it likes.

## Why this isn't done now

This audit's scope is security hardening of the app and its existing
Docker config, not standing up new infrastructure — no domain exists yet,
and adding a reverse proxy without a real cert/domain to terminate TLS for
would be configuring something that can't actually be tested end-to-end.
