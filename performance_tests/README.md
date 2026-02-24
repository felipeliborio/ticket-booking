# Performance Tests

Before running the load tests, make sure:

- The API is running.
- The frontend app is running.
- The database is seeded.

## Run events list test (1k to 5k VUs)

```bash
./run-events-ramp-1k-5k.sh
```

Equivalent command:

```bash
docker run --rm -i -v $(pwd):/scripts grafana/k6 run /scripts/events-ramp-1k-5k.js
```

## Run huge event booking test

```bash
./run-bookings-huge-event-ramp.sh
```

Equivalent command:

```bash
docker run --rm -i -v $(pwd):/scripts grafana/k6 run /scripts/bookings-huge-event-ramp.js
```
