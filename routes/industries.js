const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async(req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({industries: results.rows});
    } catch (e) {
        return next(e);
    }
});

router.get('/:code', async(req, res, next) => {
    try{
        const { code } = req.params;
        const results = await db.query(`SELECT i.code, i.industry, array_agg(c.code) AS companies FROM industries AS i LEFT JOIN companies_industries AS ci ON i.code = ci.industries_code LEFT JOIN companies AS c ON c.code = ci.companies_code WHERE i.code = $1 GROUP BY i.code ORDER BY i.code`, [code]);
        return res.json({industry: results.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.post('/', async(req, res, next) => {
    try{
        const { code, industry } = req.body;
        const results = await db.query(`INSERT INTO industries VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
        return res.json({industry: results.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.post('/:code', async(req, res, next) => {
    try{
        const industries_code = req.params.code
        const { companies_code } = req.body;
        const results = await db.query(`INSERT INTO companies_industries (companies_code, industries_code) VALUES ($1, $2) RETURNING id, companies_code, industries_code`, [companies_code, industries_code]);
        return res.json({companies_industries: results.rows[0]});
    } catch (e) {
        return next(e);
    }
})

module.exports = router;