import request from 'supertest';
import express from 'express';
import router from '../../src/api/routes';

const app = express();
app.use(express.json());
app.use('/', router);

// Mock Queue
jest.mock('../../src/lib/queue', () => ({
    ingestionQueue: {
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
    }
}));

// Mock Repositories
jest.mock('../../src/repositories/job.repository', () => ({
    JobRepository: {
        create: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
        findById: jest.fn().mockResolvedValue({ id: 'mock-job-id', status: 'PENDING' })
    }
}));

describe('API Integration', () => {
    it('should upload file', async () => {
        const res = await request(app)
            .post('/upload')
            .attach('file', Buffer.from('email,first_name\ntest@test.com,John'), 'test.csv');

        expect(res.status).toBe(202);
        expect(res.body).toHaveProperty('jobId');
    });
});
