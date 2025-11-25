import { db } from '../lib/database';

export interface Job {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    file_path: string;
    total_rows: number;
    processed_rows: number;
    failed_rows: number;
    created_at: Date;
    updated_at: Date;
}

export class JobRepository {
    static async create(filePath: string): Promise<Job> {
        const result = await db.query(
            `INSERT INTO ingestion_jobs (file_path, status) VALUES ($1, 'PENDING') RETURNING *`,
            [filePath]
        );
        return result.rows[0];
    }

    static async findById(id: string): Promise<Job | null> {
        const result = await db.query(`SELECT * FROM ingestion_jobs WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }

    static async updateStatus(id: string, status: string): Promise<void> {
        await db.query(
            `UPDATE ingestion_jobs SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, id]
        );
    }

    static async updateProgress(id: string, processed: number, failed: number): Promise<void> {
        await db.query(
            `UPDATE ingestion_jobs SET processed_rows = processed_rows + $1, failed_rows = failed_rows + $2, updated_at = NOW() WHERE id = $3`,
            [processed, failed, id]
        );
    }
}
