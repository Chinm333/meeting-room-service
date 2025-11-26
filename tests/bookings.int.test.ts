import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prismaClient';

beforeAll(async () => {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.room.create({
    data: { name: 'Room Int', capacity: 5, floor: 2, amenities: [] }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

test('create booking happy and conflict', async () => {
  const room = await prisma.room.findFirst();
  const start = new Date();
  start.setUTCHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const payload = {
    roomId: room!.id,
    title: 'Team meeting',
    organizerEmail: 'me@x.com',
    startTime: start.toISOString(),
    endTime: end.toISOString()
  };

  const res = await request(app).post('/bookings').send(payload).expect(201);
  expect(res.body).toHaveProperty('id');
  await request(app).post('/bookings').send(payload).expect(409);
});
