#!/bin/bash
# Usage: DATABASE_URL="postgres://..." ./scripts/migrate-remote.sh

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is required"
  echo "Usage: DATABASE_URL=\"postgres://...\" ./scripts/migrate-remote.sh"
  exit 1
fi

echo "Running migrations on remote database..."
DATABASE_URL="$DATABASE_URL" npx tsx server/src/db/migrate.ts

echo "Seeding data..."
DATABASE_URL="$DATABASE_URL" npx tsx server/src/db/seed.ts

echo "Done!"
