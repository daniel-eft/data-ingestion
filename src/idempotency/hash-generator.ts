import crypto from 'crypto';

export class HashGenerator {
    static generate(data: any): string {
        const canonicalString = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(canonicalString).digest('hex');
    }
}
