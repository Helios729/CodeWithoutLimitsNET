import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import catalogueRoutes from './catalogue.routes.js';
import moduleRoutes from './modules.routes.js';
import quizRoutes from './quizzes.routes.js';
import progressRoutes from './progress.routes.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * Railway's healthcheck hits this. It reports database reachability but leaks
 * no version numbers or dependency detail, since a health endpoint is one of
 * the first things an attacker reads.
 */
router.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    service: 'cwl-api',
    time: new Date().toISOString()
  });
});

router.get('/', (_req, res) => {
  res.json({
    service: 'Code Without Limits API',
    site: env.PUBLIC_WEB_URL,
    endpoints: ['/api/health', '/api/auth', '/api/catalogue', '/api/modules', '/api/quizzes', '/api/progress']
  });
});

router.use('/auth', authRoutes);
router.use('/catalogue', catalogueRoutes);
router.use('/modules', moduleRoutes);
router.use('/quizzes', quizRoutes);
router.use('/progress', progressRoutes);

export default router;
