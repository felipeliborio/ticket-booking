# ticket-booking
This is a ticket booking system for an interview assignment.

## It aims to accomplish the following:
- Be an end-to-end ticket booking app
- Prevent double-booking on high-concurrency scenarios under race conditions
- Have a clean and functional UI

### Functional Requirements
- **Ticket Catalog & Tiers:** VIP, Front Row, general admission (GA)
    - **Pricing:** VIP = $100, Front Row = $50, GA = $10
- **Availability:** UI to view all available tickets and quantities per tier
- **Booking:** UI & API to book tickets (1+ quantity per tier)
- **No Double‑Booking:** Two users must not be able to book the **same ticket** at the same time.
- **Global Users:** Users may book from any country

### Non‑Functional Requirements
- **Availability target:** *four nines* (99.99%) **design intent**
- **Scale assumptions:** ~1,000,000 DAU; peak ~50000 concurrent users
- **Performance:** Booking request p95 < 500ms

## Considerations
- There's no auth or payment integration, these funcionalities are abstracted

## Stack
### API
- Nest
- TypeScript
- Postgres
- pg + node-pg-migrate

### Frontend
- Next.js
- TypeScript
- tailwindcss
- TanStack Query

## Relevant Decisions
### The stack
**API**
PostgreSQL
- Familiarity
- Is enough to comply to the performance requirements
- Strong consistency + ACID transactions
- Hard guarantees with constraints
- Keep the architecture simple

Node pg
- Avoid overhead
- The application is small and simple enough, no need to use an ORM

Nest
- It is opinionated and similar to Spring Boot
- To reduce boilerplate
- Huge and still growing community

**Frontend**
Next.js + tailwind + Transtack Query
- Familiarity and ease of use
