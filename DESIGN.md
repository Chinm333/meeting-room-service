# DESIGN.md

This document explains data model, overlap prevention, idempotency, concurrency, error handling, and utilization calculation.

## Reference
Assignment specification: Meeting Room Booking Service. (Provided with the task). :contentReference[oaicite:0]{index=0}

## Data model
- Room: id, name (unique), capacity, floor, amenities[]
- Booking: id, roomId, title, organizerEmail, startTime, endTime, status (CONFIRMED|CANCELLED), idempotencyKey (optional)

## Overlap enforcement
- Overlap is checked by querying confirmed bookings for the room with overlapping intervals:
  `exists booking where roomId = X and status = CONFIRMED and startTime < newEnd and endTime > newStart`
- This check is performed inside a transaction for idempotent creations to avoid TOCTOU issues.

## Idempotency
- Clients may include `Idempotency-Key` header.
- Implementation: persist `idempotencyKey` on the `Booking` table and create a unique constraint on `(roomId, idempotencyKey)` (or change to `(organizerEmail, idempotencyKey)` to scope to organizer).
- Behaviour:
  - If a booking with same key exists, return it.
  - Concurrent requests race to insert; transaction + unique constraint ensures only one booking will succeed. On unique violation we fetch and return the existing booking.
- This ensures idempotency persists across restarts.

## Concurrency
- For idempotent requests we perform the overlap check + insert in a DB transaction to avoid race conditions.
- For high scale, consider row-level advisory locks or optimistic locking. For performance we did minimal locking with DB constraints.

## Cancellation rule
- Cancellation allowed up to 1 hour before start. Attempts to cancel within 1 hour return 400.
- Cancelling already cancelled booking is a no-op and returns the booking.

## Utilization calculation
- Utilization = (total confirmed booked hours overlapping [from,to]) / (total business hours in the same range).
- Business hours are Mon–Fri 08:00–20:00. We compute business hours by iterating day-by-day and summing overlaps.
- Bookings partially overlapping the requested range are clipped to [from,to] before summing.

## Error handling
- Consistent JSON:
```json
{ "error": "ValidationError", "message": "startTime must be before endTime" }
