import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import router from './routes';
import fs from 'fs';

const app = express();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/', router);

import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

app.listen(config.port, () => {
    logger.info(`API Server running on port ${config.port}`);
});
