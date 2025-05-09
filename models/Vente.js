// models/Vente.js
const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
  stockId: { type: String, required: true },
  quantite: { type: Number, required: true }
});

const venteSchema = new mongoose.Schema({
  idPlat: { type: String, required: true },
  quantite: { type: Number, required: true },
  supplementaires: [supplementSchema],
  date: { type: Date, required: true }
});

module.exports = mongoose.model('Vente', venteSchema);
