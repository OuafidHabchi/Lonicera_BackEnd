const Plat = require('../models/Plat');
const Stock = require('../models/stockModel');


// Créer un plat
exports.createPlat = async (req, res) => {
    try {
      const plat = new Plat(req.body);
        await plat.save();
      res.status(201).json(plat);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  

  exports.getAllPlats = async (req, res) => {  
    try {
      const plats = await Plat.find(); // Aucun .populate() ni Stock.find()
        res.json(plats);
    } catch (err) {
      console.error("❌ Erreur dans getAllPlats:", err);
      res.status(500).json({ message: err.message });
    }
  };
  
  
  exports.getPlatById = async (req, res) => {
    try {
      const plat = await Plat.findById(req.params.id);
      if (!plat) return res.status(404).json({ message: "Plat non trouvé" });
  
      const ingredientsDetails = await Promise.all(plat.ingredients.map(async (ing) => {
        const stockItem = await Stock.findById(ing.stockId);
        return {
          stock: stockItem,
          quantity: ing.quantity
        };
      }));
  
      res.json({
        _id: plat._id,
        name: plat.name,
        ingredients: ingredientsDetails
      });
    } catch (err) {
      console.error("❌ Erreur dans getPlatById:", err);
      res.status(500).json({ message: err.message });
    }
  };
  

// Mettre à jour un plat
exports.updatePlat = async (req, res) => {
  try {
    const plat = await Plat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plat) return res.status(404).json({ message: "Plat non trouvé" });
    res.json(plat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Supprimer un plat
exports.deletePlat = async (req, res) => {
  try {
    const plat = await Plat.findByIdAndDelete(req.params.id);
    if (!plat) return res.status(404).json({ message: "Plat non trouvé" });
    res.json({ message: "Plat supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
