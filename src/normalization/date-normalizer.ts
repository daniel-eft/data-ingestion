import { parseISO, isValid, parse } from 'date-fns';

export class DateNormalizer {
    static normalize(dateStr: any): Date | null {
        if (dateStr instanceof Date) return dateStr;
        if (!dateStr) return null;

        const str = String(dateStr).trim();

        // Try ISO
        let date = new Date(str);
        if (!isNaN(date.getTime())) return date;

        return null;
    }
}
