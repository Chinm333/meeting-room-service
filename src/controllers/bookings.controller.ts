import { Request, Response } from 'express';
import * as service from '../services/bookings.service';
import { BookingInput } from '../types';

export async function createBooking(req: Request, res: Response) {
  const idempotencyKey = req.header('Idempotency-Key') ?? undefined;
  const input: BookingInput = req.body;
  const booking = await service.createBooking(input, idempotencyKey);
  res.status(201).json(booking);
}

export async function listBookings(req: Request, res: Response) {
  const { roomId, from, to, limit = 20, offset = 0 } = req.query;
  const r = await service.listBookings({
    roomId: roomId ? Number(roomId) : undefined,
    from: from ? new Date(String(from)) : undefined,
    to: to ? new Date(String(to)) : undefined,
    limit: Number(limit),
    offset: Number(offset)
  });
  res.json(r);
}

export async function cancelBooking(req: Request, res: Response) {
  const id = Number(req.params.id);
  const result = await service.cancelBooking(id);
  res.json(result);
}
