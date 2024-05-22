process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    const [companyResult, invoiceResult] = await Promise.all([
        db.query(`INSERT INTO companies (code, name, description) VALUES ('samsung', 'Galaxy', 'Android OS') RETURNING code, name, description`),
        db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('samsung', 500) RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    ]);
    testCompany = companyResult.rows[0];
    testInvoice = invoiceResult.rows[0];
    testInvoice.add_date = testInvoice.add_date.toISOString();
  });

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
    await db.end();
})

describe('GET /invoices', () => {
    test('get all invoices',async () => {
        const result = await request(app).get('/invoices');
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({invoices: [testInvoice]})
    });
});

describe('GET /invoices/:id', () => {
    test('get a invoice', async () => {
        const result = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({invoice: {id: testInvoice.id, amt: 500, paid: false, add_date: testInvoice.add_date, paid_date: null}, company:{code: 'samsung', name: 'Galaxy', description: 'Android OS'}});
    });

    test('responds with 404 if no invoice', async () => {
        const result = await request(app).get(`/invoices/5`);
        expect(result.statusCode).toBe(404);
        expect(result.body.error.message).toEqual(`Can't get invoice with id of 5`);
    });
});

describe('POST /invoices', () => {
    test('creates an invoice', async () => {
        const result = await request(app).post(`/invoices`).send({comp_code: "samsung", amt: 300});
        const addDate = new Date(result.body.invoice.add_date);
        expect(result.statusCode).toBe(201);
        expect(result.body).toEqual({invoice: {id: expect.any(Number), comp_code: 'samsung', amt: 300, paid: false, add_date: expect.any(String), paid_date: null}});
        expect(addDate).toBeInstanceOf(Date);
    });
});

describe('PUT /invoices/:id', () => {
    test('updates an invoice', async () => {
        const result = await request(app).put(`/invoices/${testInvoice.id}`).send({amt: 400});
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({invoice: {id: testInvoice.id, comp_code: 'samsung', amt: 400, paid: false, add_date: testInvoice.add_date, paid_date: null}});
    });

    test('responds with 404 if no invoice', async () => {
        const result = await request(app).put(`/invoices/999999`).send({amt: 300});
        expect(result.statusCode).toBe(404);
        expect(result.body.error.message).toEqual(`Can't update invoice with id of 999999`);
    });
});

describe('DELETE /invoices/:id', () => {
    test('deletes an invoice', async () => {
        const result = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({status: 'deleted'});
    });

    test('responds with 404 if no invoice', async () => {
        const result = await request(app).delete(`/invoices/999999`);
        expect(result.statusCode).toBe(404);
        expect(result.body.error.message).toEqual(`Can't delete invoice with id of 999999`);
    });
});