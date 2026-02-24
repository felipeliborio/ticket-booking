import http from "k6/http";
import { check, sleep } from "k6";

// This test simulates a huge surge of bookings for what would be a popular event
// with over 80k tickets sold in about 5 minutes.

const BASE_URL = __ENV.BASE_URL ?? "http://host.docker.internal:3001";
const PATH = __ENV.PATHNAME ?? "/api/bookings";
const HUGE_EVENT_ID =
  __ENV.HUGE_EVENT_ID ?? "70f43f9d-2417-48e9-a870-f8fa0050ac84";

function toUuidFromNumber(value) {
  const suffix = Math.max(0, value).toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${suffix}`;
}

export const options = {
  stages: [
    { duration: "1s", target: 100 },
    { duration: "10s", target: 500 },
    { duration: "10s", target: 300 },
    { duration: "10s", target: 100 },
    { duration: "269s", target: 10 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const userId = toUuidFromNumber(__VU);
  const bookingId = toUuidFromNumber(__VU * 1_000_000 + __ITER);
  const vipSeats = __ITER % 3 === 0 ? 1 : 0;
  const firstRowSeats = __ITER % 3 === 1 ? 2 : 0;
  const gaSeats = __ITER % 3 === 2 ? 3 : 1;

  const payload = JSON.stringify({
    userId,
    bookingId,
    eventId: HUGE_EVENT_ID,
    vipSeats,
    firstRowSeats,
    gaSeats,
  });

  const res = http.post(`${BASE_URL}${PATH}`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  check(res, {
    "status is 201": (r) => r.status === 201,
  });

  sleep(0.1);
}
