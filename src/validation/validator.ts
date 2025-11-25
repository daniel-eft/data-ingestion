import { IngestionRowSchema, RawRowSchema } from './schemas';
import { logger } from '../lib/logger';

export class Validator {
    static validate(row: any) {
        const rawResult = RawRowSchema.safeParse(row);
        if (!rawResult.success) {
            return { success: false, error: rawResult.error };
        }

        const result = IngestionRowSchema.safeParse(row);
        return result;
    }
}
