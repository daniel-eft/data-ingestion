import { Request, Response } from 'express';
import { JobRepository } from '../../repositories/job.repository';
import { ingestionQueue } from '../../lib/queue';
import { logger } from '../../lib/logger';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const job = await JobRepository.create(req.file.path);

        await ingestionQueue.add('process-file', {
            jobId: job.id,
            filePath: req.file.path,
            mimetype: req.file.mimetype
        });

        res.status(202).json({
            message: 'File uploaded and processing started',
            jobId: job.id
        });
    } catch (error) {
        logger.error('Upload error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getJobStatus = async (req: Request, res: Response) => {
    try {
        const job = await JobRepository.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        logger.error('Get job error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
