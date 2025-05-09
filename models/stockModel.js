const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  quantityAdded: { type: Number, required: true }
});

const consumptionHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  idPlats:{type: String, required: true},
  quantityUsed: { type: Number, required: true }
});

const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 }, // Quantité totale (fixe)
  quantiteConsomee: { type: Number, default: 0 }, // Somme de toutes les consommations
  unite: { type: String, required: true },
  createdAt: { type: Date },
  purchaseHistory: [purchaseHistorySchema],
  consumptionHistory: [consumptionHistorySchema] // Nouvel historique des consommations
});
module.exports = mongoose.model('Stock', stockSchema);