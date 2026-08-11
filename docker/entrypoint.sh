#!/bin/sh
set -e

# Migrations and seeding are handled by the dedicated `migrator` service in
# docker-compose (which runs to completion before this container starts).
# This entrypoint simply hands off to the standalone Next.js server.

exec "$@"
