import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ingestro',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    batchSize: parseInt(process.env.BATCH_SIZE || '200', 10),
};
