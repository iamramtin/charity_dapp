#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Catch errors in pipelines

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

cd "programs"

log "Starting Anchor tests..."

anchor test --skip-local-validator --skip-deploy --provider.cluster localnet || { log "Anchor tests failed"; exit 1; }

log "Anchor tests completed successfully."

cd -
