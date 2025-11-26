import { createBooking as createBookingService, cancelBooking } from '../src/services/bookings.service';
import prisma from '../src/db/prismaClient';

beforeAll(async () => {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.room.create({
    data: { name: 'Room A', capacity: 4, floor: 1, amenities: ['tv'] }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

test('booking validation: duration too short', async () => {
  const room = await prisma.room.findFirst();
  await expect(createBookingService({
    roomId: room!.id,
    title: 'short',
    organizerEmail: 'a@b.com',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  }, undefined)).rejects.toMatchObject({ status: 400 });
});

test('cancellation cutoff', async () => {
  const room = await prisma.room.findFirst();
  const start = new Date(Date.now() + 30 * 60 * 1000); 
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const booking = await prisma.booking.create({
    data: {
      roomId: room!.id,
      title: 'soon',
      organizerEmail: 'x@y.com',
      startTime: start,
      endTime: end
    }
  });

  await expect(cancelBooking(booking.id)).rejects.toMatchObject({ status: 400 });
});
