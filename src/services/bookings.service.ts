import prisma from '../db/prismaClient';
import { BookingInput } from '../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from "dayjs/plugin/minMax";

dayjs.extend(isBetween);
dayjs.extend(minMax);

const BUSINESS_START = 8; 
const BUSINESS_END = 20; 

function toDate(d: string | Date) {
  return new Date(d);
}

function durationMinutes(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

function isWorkingHours(start: Date, end: Date) {
  const s = dayjs(start);
  const e = dayjs(end);
  if (s.day() === 0 || s.day() === 6) return false;
  if (e.day() === 0 || e.day() === 6) return false;

  const sHour = s.hour() + s.minute()/60;
  const eHour = e.hour() + e.minute()/60;
  return sHour >= BUSINESS_START && eHour <= BUSINESS_END;
}

export async function createBooking(input: BookingInput, idempotencyKey?: string | undefined) {
  const start = toDate(input.startTime);
  const end = toDate(input.endTime);
  if (start >= end) throw { status: 400, error: 'ValidationError', message: 'startTime must be before endTime' };

  const mins = durationMinutes(start, end);
  if (mins < 15 || mins > 4 * 60) throw { status: 400, error: 'ValidationError', message: 'Booking duration must be between 15 minutes and 4 hours' };

  if (!isWorkingHours(start, end)) throw { status: 400, error: 'ValidationError', message: 'Bookings allowed Mon-Fri 08:00-20:00' };

  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw { status: 404, error: 'NotFound', message: 'Unknown room' };
  if (idempotencyKey) {
    const existing = await prisma.booking.findFirst({
      where: { roomId: input.roomId, idempotencyKey },
    });
    if (existing) return existing;
    return await prisma.$transaction(async (prismaTx:any) => {
      const overlapping = await prismaTx.booking.findFirst({
        where: {
          roomId: input.roomId,
          status: 'CONFIRMED',
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ]
        }
      });
      if (overlapping) throw { status: 409, error: 'Conflict', message: 'Overlapping booking exists' };

      try {
        const b = await prismaTx.booking.create({
          data: {
            roomId: input.roomId,
            title: input.title,
            organizerEmail: input.organizerEmail,
            startTime: start,
            endTime: end,
            idempotencyKey
          }
        });
        return b;
      } catch (err: any) {
        if (err?.code === 'P2002') {
          const found = await prisma.booking.findFirst({ where: { roomId: input.roomId, idempotencyKey } });
          if (found) return found;
        }
        throw err;
      }
    });
  } else {
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: input.roomId,
        status: 'CONFIRMED',
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ]
      }
    });
    if (overlapping) throw { status: 409, error: 'Conflict', message: 'Overlapping booking exists' };

    const b = await prisma.booking.create({
      data: {
        roomId: input.roomId,
        title: input.title,
        organizerEmail: input.organizerEmail,
        startTime: start,
        endTime: end
      }
    });
    return b;
  }
}

export async function listBookings(opts: { roomId?: number; from?: Date; to?: Date; limit?: number; offset?: number }) {
  const { roomId, from, to, limit = 20, offset = 0 } = opts;
  const where: any = {};
  if (roomId) where.roomId = roomId;
  if (from && to) {
    where.AND = [
      { startTime: { lt: to } },
      { endTime: { gt: from } }
    ];
  } else if (from) {
    where.endTime = { gt: from };
  } else if (to) {
    where.startTime = { lt: to };
  }

  const total = await prisma.booking.count({ where });
  const items = await prisma.booking.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { startTime: 'asc' }
  });

  return { items, total, limit, offset };
}

export async function cancelBooking(id: number) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw { status: 404, error: 'NotFound', message: 'Booking not found' };

  if (booking.status === 'CANCELLED') return booking;

  const now = new Date();
  const start = booking.startTime;
  const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60);
  if (diffMinutes < 60) {
    throw { status: 400, error: 'ValidationError', message: 'Cancellation allowed up to 1 hour before start' };
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
  return updated;
}

export async function roomUtilization(from: Date, to: Date) {
  const rooms = await prisma.room.findMany();
  function businessHoursInRange(fromD: Date, toD: Date) {
    let total = 0;
    let cur = dayjs(fromD).startOf('day');
    const end = dayjs(toD);
    while (cur.isBefore(end)) {
      if (cur.day() !== 0 && cur.day() !== 6) {
        const startDay = cur.hour(BUSINESS_START).minute(0);
        const endDay = cur.hour(BUSINESS_END).minute(0);
        const s = dayjs.max(startDay, dayjs(fromD));
        const e = dayjs.min(endDay, dayjs(toD));
        if (e.isAfter(s)) {
          total += e.diff(s, 'minute') / 60;
        }
      }
      cur = cur.add(1, 'day').startOf('day');
    }
    return total;
  }

  const businessHours = businessHoursInRange(from, to);

  const report = [];
  for (const room of rooms) {
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        status: 'CONFIRMED',
        AND: [
          { startTime: { lt: to } },
          { endTime: { gt: from } }
        ]
      }
    });

    let totalBookedHours = 0;
    for (const b of bookings) {
      const s = dayjs.max(dayjs(b.startTime), dayjs(from));
      const e = dayjs.min(dayjs(b.endTime), dayjs(to));
      if (e.isAfter(s)) {
        totalBookedHours += e.diff(s, 'minute') / 60;
      }
    }
    report.push({
      roomId: room.id,
      roomName: room.name,
      totalBookingHours: totalBookedHours,
      utilizationPercent: businessHours > 0 ? totalBookedHours / businessHours : 0
    });
  }
  return report;
}
