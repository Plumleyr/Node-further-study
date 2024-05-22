const express = require('express');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify')
const ExpressError = require('../expressError');

router.get('/', async(req, res, next) => {
    try{
        const results = await db.query(`SELECT c.code, c.name, c.description, array_agg(i.industry) AS industries FROM companies AS c LEFT JOIN companies_industries AS ci ON c.code = ci.companies_code LEFT JOIN industries AS i ON i.code = ci.industries_code GROUP BY c.code ORDER BY c.code`);
        return res.json({companies: results.rows});
    } catch (e) {
        return next(e);
    }
});

router.get('/:code', async(req, res, next) =>{
    try{
        const result = await db.query(`SELECT c.code, c.name, c.description, array_agg(i.industry) AS industries FROM companies AS c LEFT JOIN companies_industries AS ci ON c.code = ci.companies_code LEFT JOIN industries AS i ON i.code = ci.industries_code WHERE c.code=$1 GROUP BY c.code ORDER BY c.code`, [req.params.code])
        if(result.rows.length === 0){
            throw new ExpressError(`no company associated with ${req.params.code}`,404)
        }
        return res.json({company: result.rows[0]})
    } catch (e) {
        return next(e)
    }
})

router.post('/', async(req, res, next) => {
    try{
        const code = slugify(req.body.code, {lower: true, remove: /[*+~.()'"!:@,;<>?|{}\/]/g});
        const { name, description } = req.body;
        const result = await db.query(`INSERT INTO companies VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({company: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.put('/:code', async(req, res, next) => {
    try{
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        if(result.rows.length === 0){
            throw new ExpressError(`Can't update company with code of ${code}`, 404)
        }
        return res.json({company: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.delete('/:code', async(req, res, next) => {
    try{
        const { code } = req.params;
        const result = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
        if(result.rowCount === 0){
            throw new ExpressError(`Can't delete company with code of ${code}`,404)
        }
        return res.json({status: 'deleted'});
    } catch (e) {
        return next(e);
    }
});

module.exports = router;