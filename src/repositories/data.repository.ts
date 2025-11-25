import { db } from '../lib/database';
import { IngestionRow } from '../validation/schemas';

export class DataRepository {
    static async batchUpsert(rows: (IngestionRow & { content_hash: string })[]): Promise<void> {
        if (rows.length === 0) return;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const values = rows.map(r => [
                r.content_hash,
                r.email,
                r.first_name,
                r.last_name,
                r.age,
                r.signup_date,
                JSON.stringify(r.metadata || {})
            ]);

            const flatValues = values.flat();

            const rowsPlaceholders = rows.map((_, i) => {
                const offset = i * 7;
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
            }).join(', ');

            const query = `
                            INSERT INTO ingested_data (content_hash, email, first_name, last_name, age, signup_date, metadata)
                            VALUES ${rowsPlaceholders}
                            ON CONFLICT (content_hash) DO UPDATE SET
                            email = EXCLUDED.email,
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            age = EXCLUDED.age,
                            signup_date = EXCLUDED.signup_date,
                            metadata = EXCLUDED.metadata,
                            updated_at = NOW()
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

    static async findAll(limit: number, offset: number) {
        const result = await db.query('SELECT * FROM ingested_data ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        return result.rows;
    }
}
