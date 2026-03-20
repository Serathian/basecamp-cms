#!/bin/sh
# docker-entrypoint.sh
set -e
echo "Running database migrations..."
node_modules/.bin/payload migrate
echo "Migrations complete. Starting server..."
exec env HOSTNAME=0.0.0.0 node server.js
