import express from 'express';
import path from 'path';
import apiRouter from './backend/src/routes/api.routes.ts';
import { schedulerService } from './backend/src/services/scheduler/scheduler.service.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API router FIRST before frontend
  app.use('/api', apiRouter);

  // Initialize background scheduler for daily overdue detection and email reminders
  try {
    schedulerService.init();
  } catch (err) {
    console.error('Failed to start scheduler service:', err);
  }

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise RCSA System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
