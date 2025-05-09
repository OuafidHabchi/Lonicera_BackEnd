const mongoose = require('mongoose');

const ingredientEntrySchema = new mongoose.Schema({
    stockId: { type: String, required: true },
    quantity: { type: String, required: true }
});

const platSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: [ingredientEntrySchema]
});

module.exports = mongoose.model('Plat', platSchema);
