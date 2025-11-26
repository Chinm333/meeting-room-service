import prisma from '../db/prismaClient';

export async function createRoom(payload: any) {
  const { name, capacity, floor, amenities } = payload;
  if (!name || typeof name !== 'string') throw { status: 400, error: 'ValidationError', message: 'name is required' };
  if (!capacity || typeof capacity !== 'number' || capacity < 1) throw { status: 400, error: 'ValidationError', message: 'capacity must be >= 1' };

  const room = await prisma.room.create({
    data: {
      name,
      capacity,
      floor,
      amenities: amenities || []
    }
  });
  return room;
}

export async function listRooms(filter: { minCapacity?: number; amenity?: string }) {
  const where: any = {};
  if (filter.minCapacity) where.capacity = { gte: filter.minCapacity };
  if (filter.amenity) where.amenities = { has: filter.amenity };
  const rooms = await prisma.room.findMany({ where });
  return rooms;
}
