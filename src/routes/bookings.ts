import express from 'express';
import * as bookingsCtrl from '../controllers/bookings.controller';
const router = express.Router();

router.post('/', bookingsCtrl.createBooking);
router.get('/', bookingsCtrl.listBookings);
router.post('/:id/cancel', bookingsCtrl.cancelBooking);

export default router;
