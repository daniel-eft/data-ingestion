import { Queue, Worker } from 'bullmq';
import { config } from './config';

const connection = {
    host: config.redis.host,
    port: config.redis.port,
};

export const ingestionQueueName = 'ingestion-queue';

export const ingestionQueue = new Queue(ingestionQueueName, {
    connection,
});

export const createWorker = (processor: any) => {
    return new Worker(ingestionQueueName, processor, {
        connection,
        concurrency: 5,
    });
};
