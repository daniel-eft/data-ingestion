import { createWorker } from '../lib/queue';
import { ingestionProcessor } from './processors/ingestion.processor';
import { logger } from '../lib/logger';

const worker = createWorker(ingestionProcessor);

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, err);
});

logger.info('Worker started');
