process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies VALUES ('samsung', 'Galaxy', 'Android OS') RETURNING code, name, description`);
    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('get all companies',async () => {
        const result = await request(app).get('/companies');
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({companies: [testCompany]});
    });
});

describe('GET /companies/:code', () => {
    test('get a company',async () => {
        const result = await request(app).get(`/companies/${testCompany.code}`);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({company: testCompany});
        console.log(result.body)
    });

    test('responds with 404 if no company associated with code',async () => {
        const result = await request(app).get(`/companies/banana`);
        expect(result.statusCode).toBe(404);
        expect(result.body).toEqual({error: { message: 'no company associated with banana', status: 404 }});
    });
});

describe('POST /companies', () => {
    test('create a company',async () => {
        const result = await request(app).post('/companies').send({code: 'apple', name: 'Apple Computer', description: 'Maker Of OSX'});
        expect(result.statusCode).toBe(201);
        expect(result.body).toEqual({company: {code: 'apple', name: 'Apple Computer', description: 'Maker Of OSX'}});
    });

    test('no spaces, lowercase and no weird punc', async () => {
        const result = await request(app).post('/companies').send({code: `NvIdiA;'",./{)}`, name: 'RTX 4090', description: 'Maker Of Best GPU'});
        expect(result.statusCode).toBe(201);
        expect(result.body).toEqual({company: {code: 'nvidia', name: 'RTX 4090', description: 'Maker Of Best GPU'}});
    });
});

describe('PUT /companies/:code', () => {
    test('update a company', async () => {
        const result = await request(app).put(`/companies/${testCompany.code}`).send({name: 'Iphone', description: 'Maker of IOS'});
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({company: {code: `${testCompany.code}`, name: 'Iphone', description: 'Maker of IOS'}});
    });

    test('responds with 404 if no company associated with code',async () => {
        const result = await request(app).put(`/companies/banana`).send({name: 'Iphone', description: 'Maker of IOS'});
        expect(result.statusCode).toBe(404);
        expect(result.body).toEqual({error: { message: "Can't update company with code of banana", status: 404 }});
    });
});

describe('DELETE /companies/:code', () => {
    test('delete a company', async () => {
        const result = await request(app).delete(`/companies/${testCompany.code}`);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({status:'deleted'});
    });

    test('responds with 404 if no company', async () => {
        const result = await request(app).delete(`/companies/banana`);
        expect(result.statusCode).toBe(404);
        expect(result.body).toEqual({error: {message: "Can't delete company with code of banana", status: 404}});
    });
});