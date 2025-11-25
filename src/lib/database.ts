import { Pool } from 'pg';
import { config } from './config';
import { logger } from './logger';

const pool = new Pool({
    connectionString: config.database.url,
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool,
};
