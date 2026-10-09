import 'dotenv/config'; // MUST BE LINE 1
import express from 'express';
import http from 'http';
import path from 'path';
import { authRouter } from './src/routes/authRoutes.ts';
import { studentRouter } from './src/routes/studentRoutes.ts';
import { adminRouter } from './src/routes/adminRoutes.ts';
import { battleRouter } from './src/routes/battleRoutes.ts';
import { attachBattleSocketServer } from './src/lib/battleEngine.ts';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // Health check endpoint for Cloud Run readiness probes
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Attach real-time Socket.IO server for 1 vs 1 Skill Battle
  attachBattleSocketServer(httpServer);

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/battle', battleRouter);
  app.use('/api', studentRouter);

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
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
