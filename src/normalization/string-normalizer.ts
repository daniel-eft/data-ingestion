export class StringNormalizer {
    static normalize(value: any): string {
        if (typeof value !== 'string') return '';
        return value.trim();
    }

    static normalizeEmail(email: any): string {
        return this.normalize(email).toLowerCase();
    }
}
