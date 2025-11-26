import express from 'express';
import * as roomsCtrl from '../controllers/rooms.controller';
const router = express.Router();

router.post('/', roomsCtrl.createRoom);
router.get('/', roomsCtrl.listRooms);

export default router;
