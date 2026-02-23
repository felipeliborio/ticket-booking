# ticket-booking
This is a ticket booking system for an interview assignment.

## Running instructions

** From the root of the repository **

Run the container described by /api/infra/compose.yaml
- `docker compose -f api/infra/compose.yaml up`

Using an lts/krypton instalation of node js run:
- `npm --prefix api i`
- `npm --prefix api run migrations:up`
- `npm --prefix api run seed`
- `npm --prefix api run start:dev` or `npm --prefix api run build && npm --prefix api run start`

- `npm --prefix app i`
- `npm --prefix app run dev` or `cp ./app/.env.development ./app/.env && npm --prefix app run build && npm --prefix app start`

The credentials for the database are in /api/.env.development

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
Next.js + tailwind
- Familiarity and ease of use
- Good DX with agents

### API implementation decisions
** Persistence Layer **

Given the limited amount of time I could dedicate to this task, I focused more
on funcionality than performance alone, that said, with a few tweaks performance 
can be really good with the stack of choice. Even before using caches and queues 
[postgres alone can get fast enough to serve hundreds of thousands of ticket booking 
operations per minute](https://hatchet.run/blog/fastest-postgres-inserts).

As to reduce overhead, the node-pg extension was used instead of any ORM.

And further opmizations can be made in the application itself, to alleviate the 
database usage, as caching requests with the event occupancy and the listing of 
events. This caching could even be made at the frontend application, that in 
turn could be closer to the users, reducing latency as well.

** Entities **

All entities have a numeric id and an external_id that is  an UUID, I like it 
this way because it allows for more efficient FKs and said FKs are more user 
friendly in case you need to access the db directly. At the same time, UUIDs are
returned to the users to obfuscate the numeric ids and also friendly to 
distributed systems.

All coluns with a fixed and known number of values are enum types.

- app_user
Used to store the mock users, just an UUID.

- booking
  
- venue
I wanted to make the system more plausible to what we see in the real world, 
allowing for multiple venues with different ticket distributions to be used.
It is, though, really simplified and follows the basic rules of the assignment, 
the venues all have just tree tiers and they model only capacity, not 
disposition, so no numbered seats, no ways of representing the venue in a visual 
manner, or chosing a seat position beyond the three tiers.

- event
Following the same logic as for the venue, I wanted to add listing and searching 
and allow for a more realistically way of testing a system of this kind 
(there are not paid events with a million tickets in the real world, but there 
can be 20 events with 50k seats each, so this is more in line with reallity).

This table has an additional index for event_datetime + external_id, it is used 
to order the listing of events at the homepage in crescent order of the date 
it will be held using cursor pagination.

There are prices for each tier, since the tiering is fixed, even though the 
pricing is fixed, so I just seed with the prices disclosed at the assignment 
description.

- booking
Each booking can contain multiple tickets, so there are columns for the ammount 
of each kind. Since the three-tier rule is fixed into the venue and event tables, 
the same is done here, the number of tickets for each seat is etched in one 
column for each tier.

This table has an extra index for failing expired bookings, status + created_at, 
so a routine can efficiently update the status of old unpaid bookings to failure.

- payment
This is table is used to mock the payment process, it has a trigger to update 
the status of the booking accordingly to the status of the payment.

- pgmigrations
I used node-pg-migrate and it creates this table to keep track of the migrations.

- seed_history
There is a seeding script in the API, this just track its execution

** Endpoints **
- Status
  - GET /status
  Mainly created to serve as a model for the agent, it returns the status of the 
  API services, currently only the DB.

- Events
  - GET /events
  Lists the events, is paginated using cursor pagination to keep response time
  stable, even tough, realistically, no user would ever go to a second page 
  probably ever.
  
  It also accepts a name filter. Just a simple ILIKE added to the query, 
  so no fuzzy search.

  - GET /events/{id}
  Find by id
  
  - GET /events/{id}/availability
  Returns the tickets available at each tier for a given event. No caching, but 
  there's no need to cache in the API cause this can be cached closer to the 
  user at the frontend.

  - Bookings
    - GET /bookings
    This list the bookings made by an "user", it's a nice way to visually check 
    that the application is working and to make it feel more complete. So I 
    added such list, since it's not expected for an user to make that many 
    bookings in their whole life, this is not paginated.
    - POST /bookings
    This creates the booking that can be for many tickets across multiple tiers.
    The user also is not prohibited from making multiple purchases so the 
    responsability of reducing duplication erros in case of system instabilities 
    lies with the frontend. So the frontend itself generates the external id of 
    the booking that in turn is unique indexed in the db.
    The frontend will also send an uuid representing the user, so there can be a 
    logic for different users in the application even though there is no auth.

  - Payment
    - POST /payment
    This is an abstraction of the payment flow, allows for the user to simulate 
    payment success and failure.
    
** Freeing unpaid seats **

There is a routine that runs every 30 seconds and fails the bookings that are 
pending for more than 5 minutes (this is hard coded but could be turned into a 
configuration in many ways, such as stored in a settings table or an environment
variable). This is achieved by running a simple update that is fast since there 
is an index for it. This is a good enough compromise of performance and simplicity 
and can free unpaid seats in a reasonable time. Also, it could be moved to the a
cron in the DB itself to avoid having to deal with avoiding unnecessary 
executions an infrastructure with horizontal scaling.

** Performance and correctness **

Most of the performance considerations rely on a streamlined and optimized 
approach to using the DB of choice, so the correct design and indexing of the 
database should be enough to comply to the performance requirements of the 
application given the appropriate environment.

This can be seen on the use of upserts, triggers, use of raw queries and 
modeling of the db itself.

So the goal of the aplication can the met at the backend layer by horizontally 
scaling the API instances. Given the simple nature of the booking operation, 
where there are no numbered seats, there is no pressing need for using things 
like read replicas unless there is also a need to use multi-region instances for 
the API given the 500ms p95 booking target, since the main idea is that the DB 
will only receive a heavy load from the booking endpoint and al else can be cached 
at the frontend application.

Also, upserting a user is currently part of the booking operation, what would not
happen in a scenario where there is authentication.

The correctness under race conditions is guaranteed by the use of atomic 
operations and constraints in the database.

### Frontend implementation decisions

The frontend was mostely implemented after the complete creation of the API, as 
to give the LLM agent used to assist in the implementation full understanding of 
the system. So after I initialized the application all the frontend 
implementation could be guided to the agent.

So, basically there is a clean and responsive design split across three pages
(home, event details and my bookings) and there is button to generate a new user, 
stored at local storage, to simplify the testing.

## Complying to the non functional requirements

- **Availability target:** *four nines* (99.99%) **design intent** — you won’t implement HA multi‑region, just discuss how your design would achieve it in the Readme.
- **Scale assumptions:** ~1,000,000 DAU; peak ~50000 concurrent users. Just discuss how your design would achieve it in the Readme.
- **Performance:** Booking request p95 < 500ms. Just discuss how your design would achieve it in the Readme.

To comply to the availability target, on the infraestructure side of things, 
you'd simply relly on a provider that complies to this target, e.g. AWS. And 
choose the appropriate products on their catalog that will suffice for your 
needs.

To comply to 1mi daily and 50k concurrent users, you could scale you frontend 
horizontally and across multiple regions, could even use an Edge service, like 
AWS Amplify Hosting, to have multiple instances of the application running close 
to the clients. As discussed above, caching as many requests to the API as 
possible would be enough to minimize the load on the database, and for the API 
itself, it could also scale horizontally.

The p95 < 500ms is achieved by the same means disclosed for the scale 
assumptions, since booking is such a simple operation and is most of what the 
db would be doing under high load circumstances. In a situation where this 
proves not to be enough, using batch operations would make the db faster, at the 
cost of requiring aditional queueing logic in the processing of new requests.
