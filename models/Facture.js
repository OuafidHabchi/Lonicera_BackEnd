const mongoose = require('mongoose');

const FactureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  total: { type: String, required: true },
  filePath: { type: String, required: true },
  note: { type: String },
  createdAt: { type: String, required: true }
});

module.exports = mongoose.model('Facture', FactureSchema);
