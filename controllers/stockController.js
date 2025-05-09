const Stock = require('../models/stockModel');

// Créer un stock
exports.createStock = async (req, res) => {
  try {
    const stock = new Stock(req.body); // Le front envoie createdAt
    const saved = await stock.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtenir tous les stocks
exports.getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtenir les détails d'un stock
exports.getStockDetails = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Stock non trouvé' });
    res.json(stock);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mettre à jour un stock
exports.updateStock = async (req, res) => {
  try {
    const updated = await Stock.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Stock non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ajouter de la quantité
exports.addStockQuantity = async (req, res) => {
  try {
    const { quantityAdded, date } = req.body; // Date reçue depuis le front

    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Stock non trouvé' });

    stock.purchaseHistory.push({
      quantityAdded: Number(quantityAdded),
      date: new Date(date) // Conversion de la string en Date
    });

    stock.quantity += Number(quantityAdded);
    const updated = await stock.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer un stock
exports.deleteStock = async (req, res) => {
  try {
    const deleted = await Stock.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Stock non trouvé' });
    res.json({ message: 'Stock supprimé' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};