import fs from 'fs';
import { logger } from '../lib/logger';

export const removeFile = (filePath: string) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        logger.error(`Error removing file ${filePath}`, error);
    }
};
