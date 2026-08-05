const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    label: { type: String, required: true },
    state: { type: mongoose.Schema.Types.Mixed, required: true }, // full invoice form data
    savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
