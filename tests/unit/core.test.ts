import { Normalizer } from '../../src/normalization/normalizer';
import { Validator } from '../../src/validation/validator';
import { HashGenerator } from '../../src/idempotency/hash-generator';

describe('Normalization', () => {
    it('should normalize email and trim strings', () => {
        const input = {
            email: '  TEST@Example.com ',
            first_name: ' John ',
            last_name: ' Doe '
        };
        const output = Normalizer.normalizeRow(input);
        expect(output.email).toBe('test@example.com');
        expect(output.first_name).toBe('John');
        expect(output.last_name).toBe('Doe');
    });

    it('should parse dates', () => {
        const input = { email: 'test@test.com', signup_date: '2023-01-01T00:00:00Z' };
        const output = Normalizer.normalizeRow(input);
        expect(output.signup_date).toBeInstanceOf(Date);
    });
});

describe('Validation', () => {
    it('should validate correct row', () => {
        const row = {
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            signup_date: new Date()
        };
        const result = Validator.validate(row);
        expect(result.success).toBe(true);
    });

    it('should fail invalid email', () => {
        const row = {
            email: 'invalid-email',
            first_name: 'John',
            last_name: 'Doe',
            signup_date: new Date()
        };
        const result = Validator.validate(row);
        expect(result.success).toBe(false);
    });
});

describe('Hashing', () => {
    it('should generate same hash for same content', () => {
        const row1 = { a: 1, b: 2 };
        const row2 = { b: 2, a: 1 }; // Different order
        const hash1 = HashGenerator.generate(row1);
        const hash2 = HashGenerator.generate(row2);
        expect(hash1).toBe(hash2);
    });
});
