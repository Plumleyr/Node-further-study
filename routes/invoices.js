const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async(req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    } catch (e) {
        return next(e);
    }
});

router.get('/:id', async(req, res, next) => {
    try{
        const result = await db.query(`SELECT * FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id = $1`, [req.params.id]);
        if(result.rows.length === 0){
            throw new ExpressError(`Can't get invoice with id of ${req.params.id}`, 404);
        }
        const { id, amt, paid, add_date, paid_date, code, name, description } = result.rows[0];
        return res.json({invoice: {id: id, amt: amt, paid: paid, add_date: add_date, paid_date: paid_date}, company:{code: code, name: name, description: description}});
    } catch (e) {
        return next(e);
    }
});

router.post('/', async(req, res, next) => {
    try{
        const {comp_code, amt} = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({invoice: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.put('/:id', async(req, res, next) => {
    try{
        const { id } = req.params;
        const { amt , paid } = req.body;
        let paid_date;
        const currResults = await db.query(`SELECT paid_date FROM invoices WHERE id = $1`, [id]);
        if(currResults.rows.length === 0){
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
        }

        const currentPaidDate = currResults.rows[0].paid_date;

        if (currentPaidDate === null) {
            paid_date = paid ? new Date().toISOString().slice(0, 10) : null;
        } else if (currentPaidDate !== null && paid === false) {
            paid_date = null;
        } else {
            paid_date = currentPaidDate;
        }

        const result = await db.query(`UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paid_date, id]);
        res.json({invoice: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

router.delete('/:id', async(req, res, next) => {
    try{
        const { id } = req.params;
        const result = await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
        if(result.rowCount === 0){
            throw new ExpressError(`Can't delete invoice with id of ${id}`, 404);
        }
        return res.json({status: "deleted"});
    } catch (e) {
        return next(e);
    }
});

module.exports = router;