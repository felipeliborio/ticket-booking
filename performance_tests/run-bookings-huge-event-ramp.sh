#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

docker run --rm -i -v "${SCRIPT_DIR}":/scripts grafana/k6 run /scripts/bookings-huge-event-ramp.js
