import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('E2E Full Flow', () => {
    if (!process.env.E2E_TESTING) {
        it.skip('Skipping E2E test - set E2E_TESTING=true and ensure Docker is up', () => { });
        return;
    }

    it('should upload a file, process it, and allow querying data', async () => {
        // 1. Upload
        const uploadRes = await request(API_URL)
            .post('/upload')
            .attach('file', Buffer.from('email,first_name,last_name,signup_date\ne2e@test.com,E2E,User,2023-01-01'), 'e2e.csv');

        expect(uploadRes.status).toBe(202);
        const jobId = uploadRes.body.jobId;

        let status = 'PENDING';
        while (status !== 'COMPLETED' && status !== 'FAILED') {
            await new Promise(r => setTimeout(r, 1000));
            const jobRes = await request(API_URL).get(`/jobs/${jobId}`);
            status = jobRes.body.status;
        }

        expect(status).toBe('COMPLETED');

        const dataRes = await request(API_URL).get('/data');
        const rows = dataRes.body.data;
        const uploadedRow = rows.find((r: any) => r.email === 'e2e@test.com');

        expect(uploadedRow).toBeDefined();
        expect(uploadedRow.first_name).toBe('E2E');
    }, 30000);
});
