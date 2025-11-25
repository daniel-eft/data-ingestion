import { Router } from 'express';
import multer from 'multer';
import { config } from '../../lib/config';
import * as JobController from '../controllers/job.controller';
import * as DataController from '../controllers/data.controller';

const router = Router();
const upload = multer({ dest: config.uploadDir });

// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/upload', upload.single('file'), JobController.uploadFile);
router.get('/jobs/:id', JobController.getJobStatus);
router.get('/data', DataController.getData);

export default router;
