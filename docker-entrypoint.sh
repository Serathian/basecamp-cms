#!/bin/sh
# docker-entrypoint.sh
set -e
if ! mkdir -p /app/media/nitf_media /app/media/jr_media 2>/dev/null; then
  echo "WARNING: /app/media is not writable by $(id -un); uploads to nitf_media/jr_media may fail unless volume permissions allow uid $(id -u)." >&2
fi
echo "Running database migrations..."
NODE_OPTIONS=--no-deprecation node_modules/.bin/payload migrate
echo "Migrations complete. Starting server..."
exec env HOSTNAME=0.0.0.0 node server.js
