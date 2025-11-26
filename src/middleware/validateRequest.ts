import { z } from 'zod';

export const bookingSchema = z.object({
  roomId: z.number(),
  title: z.string(),
  organizerEmail: z.string().email(),
  startTime: z.string(),
  endTime: z.string()
});
