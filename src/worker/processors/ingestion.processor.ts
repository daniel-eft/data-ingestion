import { Job } from 'bullmq';
import fs from 'fs';
import csv from 'csv-parser';
import JSONStream from 'JSONStream';
import { JobRepository } from '../../repositories/job.repository';
import { DataRepository } from '../../repositories/data.repository';
import { ErrorRepository } from '../../repositories/error.repository';
import { Normalizer } from '../../normalization/normalizer';
import { Validator } from '../../validation/validator';
import { HashGenerator } from '../../idempotency/hash-generator';
import { logger } from '../../lib/logger';
import { config } from '../../lib/config';

export const ingestionProcessor = async (job: Job) => {
    const { jobId, filePath, mimetype } = job.data;

    await JobRepository.updateStatus(jobId, 'PROCESSING');

    let processedRows = 0;
    let failedRows = 0;
    let batch: any[] = [];
    let errorBatch: any[] = [];
    let rowIndex = 0;

    const processBatch = async () => {
        if (batch.length > 0) {
            await DataRepository.batchUpsert(batch);
            batch = [];
        }
        if (errorBatch.length > 0) {
            await ErrorRepository.batchInsert(errorBatch);
            errorBatch = [];
        }
        await JobRepository.updateProgress(jobId, processedRows, failedRows);
        // Reset counters for the next update delta
        processedRows = 0;
        failedRows = 0;
    };

    const handleRow = async (row: any) => {
        rowIndex++;
        try {
            // 1. Normalize
            const normalized = Normalizer.normalizeRow(row);

            // 2. Validate
            const validation = Validator.validate(normalized);

            if (!validation.success) {
                failedRows++;
                errorBatch.push({
                    jobId,
                    rowIndex,
                    rawData: row,
                    error: validation.error
                });
            } else {
                // 3. Hash
                const contentHash = HashGenerator.generate(normalized);

                processedRows++;
                batch.push({
                    ...normalized,
                    content_hash: contentHash
                });
            }

            if (batch.length >= config.batchSize || errorBatch.length >= config.batchSize) {
                await processBatch();
            }
        } catch (err) {
            logger.error('Error processing row', err);
            failedRows++;
        }
    };

    return new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filePath);

        let pipeline;
        if (mimetype === 'application/json') {
            pipeline = stream.pipe(JSONStream.parse('*'));
        } else {
            pipeline = stream.pipe(csv());
        }

        pipeline.on('data', async (row: any) => {
            stream.pause();
            await handleRow(row);
            stream.resume();
        });

        pipeline.on('end', async () => {
            try {
                await processBatch(); // Flush remaining
                await JobRepository.updateStatus(jobId, 'COMPLETED');
                // Cleanup file
                fs.unlinkSync(filePath);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        pipeline.on('error', async (err: any) => {
            logger.error('Stream error', err);
            await JobRepository.updateStatus(jobId, 'FAILED');
            reject(err);
        });
    });
};
