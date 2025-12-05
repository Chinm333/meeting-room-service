import express from 'express';
import * as bookingsService from '../services/bookings.service';

const router = express.Router();

router.get('/room-utilization', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Missing from or to query params"
    });
  }

  const report = await bookingsService.roomUtilization(
    new Date(String(from)),
    new Date(String(to))
  );

  res.json(report);
});

export default router;
