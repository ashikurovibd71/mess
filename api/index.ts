import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/routes.js';
import { initDb } from '../server/db.js';

dotenv.config();

const app = express();

app.use(express.json());

let dbInitialized = false;

// Ensure database is initialized before serving requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize DB:', err);
    }
  }
  next();
});

// The rewrite sends /api/* to this function, keeping the /api prefix in req.url
app.use('/api', apiRouter);

export default app;
