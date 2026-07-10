import morgan from 'morgan';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(morgan('combined'));
// Chat attachments are base64-encoded images/audio, well past the default
// 100kb JSON limit — allow larger bodies so /ai/scan uploads don't 413.
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
app.use('/api/bff', routes);

// Express error middleware must be registered after the routes it covers.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
