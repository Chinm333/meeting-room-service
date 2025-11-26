import express from 'express';
import bodyParser from 'body-parser';
import 'express-async-errors';
import roomsRouter from './routes/rooms';
import bookingsRouter from './routes/bookings';
import errorHandler from './middleware/errorHandler';

const app = express();
app.use(bodyParser.json());

app.use('/rooms', roomsRouter);
app.use('/bookings', bookingsRouter);

app.use(errorHandler);

export default app;
