import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL ?? "http://host.docker.internal:3001";
const PATH = __ENV.PATHNAME ?? "/api/events?limit=12&name=event";

// This test simulates a surge of accesses to the homepage
// Can serve over 5000 r/s per server.

export const options = {
  stages: [
    { duration: "1s", target: 1000 },
    { duration: "4s", target: 2000 },
    { duration: "5s", target: 3000 },
    { duration: "10s", target: 4000 },
    { duration: "30s", target: 5000 },
    { duration: "10s", target: 500 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}${PATH}`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(0.5);
}
