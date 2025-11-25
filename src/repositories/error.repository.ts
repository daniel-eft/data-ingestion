import { db } from '../lib/database';

export class ErrorRepository {
    static async batchInsert(errors: { jobId: string; rowIndex: number; rawData: any; error: any }[]): Promise<void> {
        if (errors.length === 0) return;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const values = errors.map(e => [
                e.jobId,
                e.rowIndex,
                JSON.stringify(e.rawData),
                JSON.stringify(e.error)
            ]);

            const flatValues = values.flat();
            const placeholders = errors.map((_, i) => {
                const offset = i * 4;
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
            }).join(', ');

            const query = `
        INSERT INTO validation_errors (job_id, row_index, raw_data, error_details)
        VALUES ${placeholders}
      `;

            await client.query(query, flatValues);

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}
