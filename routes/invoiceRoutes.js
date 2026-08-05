const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// 📌 Save a new invoice
router.post('/', async (req, res) => {
    try {
        const { label, state } = req.body;
        if (!label || !state) {
            return res.status(400).json({ error: 'label and state are required' });
        }
        const invoice = new Invoice({ label, state, savedAt: new Date() });
        await invoice.save();
        res.json({ id: invoice._id, label: invoice.label, savedAt: invoice.savedAt });
    } catch (error) {
        console.error('❌ Invoice Save Error:', error);
        res.status(500).json({ error: 'Error saving invoice' });
    }
});

// 📌 List all saved invoices (metadata only, not the full item table)
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find({}, 'label savedAt').sort({ savedAt: -1 });
        res.json(invoices.map(inv => ({ id: inv._id, label: inv.label, savedAt: inv.savedAt })));
    } catch (error) {
        console.error('❌ Invoice List Error:', error);
        res.status(500).json({ error: 'Error listing invoices' });
    }
});

// 📌 Get one invoice, full data
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ error: 'Not found' });
        res.json({ id: invoice._id, label: invoice.label, savedAt: invoice.savedAt, state: invoice.state });
    } catch (error) {
        console.error('❌ Invoice Fetch Error:', error);
        res.status(400).json({ error: 'Invalid id or failed to fetch invoice' });
    }
});

// 📌 Delete an invoice
router.delete('/:id', async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Invoice Delete Error:', error);
        res.status(400).json({ error: 'Invalid id or failed to delete invoice' });
    }
});

module.exports = router;
