const request = require('supertest')
const app = require('../app')

describe('APP check status', () => {
    test('try to ping', async () => {
        const response = await request(app).get('/ping')
        expect(response.statusCode).toBe(200)
    })
})
