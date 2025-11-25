import { StringNormalizer } from './string-normalizer';
import { DateNormalizer } from './date-normalizer';

export class Normalizer {
    static normalizeRow(row: any): any {
        const normalized: any = {};

        if (row.email) normalized.email = StringNormalizer.normalizeEmail(row.email);
        if (row.first_name) normalized.first_name = StringNormalizer.normalize(row.first_name);
        if (row.last_name) normalized.last_name = StringNormalizer.normalize(row.last_name);

        if (row.age) {
            const num = parseInt(String(row.age), 10);
            if (!isNaN(num)) normalized.age = num;
        }

        if (row.signup_date) {
            const date = DateNormalizer.normalize(row.signup_date);
            if (date) normalized.signup_date = date;
        }

        if (row.metadata) {
            try {
                normalized.metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
            } catch (e) {
                normalized.metadata = {};
            }
        }

        // Pass through ID if present
        if (row.id) normalized.id = row.id;

        return normalized;
    }
}
