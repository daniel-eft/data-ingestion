import { Request, Response } from 'express';
import { DataRepository } from '../../repositories/data.repository';
import { logger } from '../../lib/logger';

export const getData = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const data = await DataRepository.findAll(limit, offset);
        res.json({
            data,
            page,
            limit
        });
    } catch (error) {
        logger.error('Get data error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
