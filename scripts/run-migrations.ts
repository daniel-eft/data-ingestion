import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/database';
import { logger } from '../src/lib/logger';

const runMigrations = async () => {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    const client = await db.getClient();

    try {
        for (const file of files) {
            if (file.endsWith('.sql')) {
                logger.info(`Running migration: ${file}`);
                const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
                await client.query(content);
            }
        }
        logger.info('Migrations completed');
    } catch (e) {
        logger.error('Migration failed', e);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

runMigrations();
