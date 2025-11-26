
# Meeting Room Booking Service

## Requirements
- Node 18+
- npm

## Quick start
1. In`.env` , adjust `DATABASE_URL`.
2. Start Postgres:

## TESTING _ API ENDPOINTS

##### POST /rooms
```
{
  "name": "Room A",
  "capacity": 10,
  "floor": 2,
  "amenities": ["tv", "whiteboard"]
}
```

##### GET /rooms
```
{
  minCapacity=5,
  amenity=tv
}
```

##### POST /bookings
```
{
  "roomId": 1,
  "title": "Team Sync Meeting",
  "organizerEmail": "team@example.com",
  "startTime": "2025-01-08T09:00:00.000Z",
  "endTime": "2025-01-08T10:00:00.000Z"
}
```
##### POST /bookings with Idempotency-Key
```

{
  "roomId": 1,
  "title": "Board Meeting",
  "organizerEmail": "ceo@example.com",
  "startTime": "2025-01-09T11:00:00.000Z",
  "endTime": "2025-01-09T12:30:00.000Z"
}
```
##### GET /bookings
```
{
   roomId=1
  from=2025-01-01T00:00:00.000Z
  to=2025-01-30T00:00:00.000Z
  limit=20
  offset=0
}

```
##### POST /bookings/:id/cancel
```
  empty body
```

##### GET /reports/room-utilization
```
{
  from=date ISO
  to=date ISO
}

```

