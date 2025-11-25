import { z } from 'zod';

export const IngestionRowSchema = z.object({
    id: z.string().optional(),
    email: z.string().email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    age: z.number().int().min(0).optional(),
    signup_date: z.date(),
    metadata: z.record(z.any()).optional(),
});

export type IngestionRow = z.infer<typeof IngestionRowSchema>;

export const RawRowSchema = z.object({
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    age: z.union([z.string(), z.number()]).optional(),
    signup_date: z.union([z.string(), z.date()]),
    metadata: z.union([z.string(), z.record(z.any())]).optional(),
}).passthrough();
