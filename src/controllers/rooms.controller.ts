import { Request, Response } from 'express';
import * as service from '../services/rooms.service';

export async function createRoom(req: Request, res: Response) {
  const payload = req.body;
  const room = await service.createRoom(payload);
  res.status(201).json(room);
}

export async function listRooms(req: Request, res: Response) {
  const { minCapacity, amenity } = req.query;
  const rooms = await service.listRooms({
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
    amenity: amenity ? String(amenity) : undefined
  });
  res.json(rooms);
}
