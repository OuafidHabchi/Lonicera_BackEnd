const Vente = require('../models/Vente');
const Stock = require('../models/stockModel');
const Plat = require('../models/Plat');



// ➕ Créer une vente
exports.createVente = async (req, res) => {
    try {
      const { idPlat, quantite, supplementaires, date } = req.body;
  
      // 1. Enregistrer la vente
      const vente = new Vente({ idPlat, quantite, supplementaires, date });
      await vente.save();
  
      // 2. Récupérer les détails du plat
      const plat = await Plat.findById(idPlat);
      if (!plat) {
        return res.status(404).json({ message: "Plat introuvable." });
      }
  
      // 3. Gérer les ingrédients du plat
      for (const ingredient of plat.ingredients) {
        const stock = await Stock.findById(ingredient.stockId);
        if (stock) {
          const quantityUsed = Number(ingredient.quantity) * quantite;
  
          stock.consumptionHistory.push({
            date,
            idPlats: idPlat,
            quantityUsed
          });
  
          stock.quantiteConsomee += quantityUsed;
  
          await stock.save();
        }
      }
  
      // 4. Gérer les suppléments
      if (supplementaires && Array.isArray(supplementaires)) {
        for (const supp of supplementaires) {
          const stock = await Stock.findById(supp.stockId);
          if (stock) {
            const quantityUsed = supp.quantite;
  
            stock.consumptionHistory.push({
              date,
              idPlats: idPlat,
              quantityUsed
            });
  
            stock.quantiteConsomee += quantityUsed;
  
            await stock.save();
          }
        }
      }
  
      res.status(201).json(vente);
    } catch (err) {
      console.error("❌ Erreur lors de la création de la vente :", err);
      res.status(400).json({ message: err.message });
    }
  };


// 📋 Lire toutes les ventes
exports.getAllVentes = async (req, res) => {
  try {
    const ventes = await Vente.find();
    res.json(ventes);
  } catch (err) {
    console.error("❌ Erreur dans getAllVentes:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Lire une vente par ID
exports.getVenteById = async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id);
    if (!vente) return res.status(404).json({ message: "Vente non trouvée" });
    res.json(vente);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVente = async (req, res) => {
  try {
    const oldVente = await Vente.findById(req.params.id);
    if (!oldVente) return res.status(404).json({ message: "Vente non trouvée" });

    // 1. Supprimer l'ancien historique de consommation
    const plat = await Plat.findById(oldVente.idPlat);
    if (plat) {
      for (const ingredient of plat.ingredients) {
        const stock = await Stock.findById(ingredient.stockId);
        if (stock) {
          const quantityUsed = Number(ingredient.quantity) * oldVente.quantite;
          stock.consumptionHistory = stock.consumptionHistory.filter(h => !(h.date.getTime() === oldVente.date.getTime() && h.idPlats === oldVente.idPlat && h.quantityUsed === quantityUsed));
          stock.quantiteConsomee -= quantityUsed;
          await stock.save();
        }
      }
    }

    for (const supp of oldVente.supplementaires) {
      const stock = await Stock.findById(supp.stockId);
      if (stock) {
        stock.consumptionHistory = stock.consumptionHistory.filter(h => !(h.date.getTime() === oldVente.date.getTime() && h.idPlats === oldVente.idPlat && h.quantityUsed === supp.quantite));
        stock.quantiteConsomee -= supp.quantite;
        await stock.save();
      }
    }

    // 2. Enregistrer la nouvelle vente
    const newVente = await Vente.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 3. Ajouter le nouvel historique
    const newPlat = await Plat.findById(newVente.idPlat);
    if (newPlat) {
      for (const ingredient of newPlat.ingredients) {
        const stock = await Stock.findById(ingredient.stockId);
        if (stock) {
          const quantityUsed = Number(ingredient.quantity) * newVente.quantite;
          stock.consumptionHistory.push({
            date: newVente.date,
            idPlats: newVente.idPlat,
            quantityUsed
          });
          stock.quantiteConsomee += quantityUsed;
          await stock.save();
        }
      }
    }

    for (const supp of newVente.supplementaires) {
      const stock = await Stock.findById(supp.stockId);
      if (stock) {
        stock.consumptionHistory.push({
          date: newVente.date,
          idPlats: newVente.idPlat,
          quantityUsed: supp.quantite
        });
        stock.quantiteConsomee += supp.quantite;
        await stock.save();
      }
    }

    res.json(newVente);
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour de la vente :", err);
    res.status(400).json({ message: err.message });
  }
};


// ❌ Supprimer une vente
exports.deleteVente = async (req, res) => {
    try {
      const vente = await Vente.findByIdAndDelete(req.params.id);
      if (!vente) return res.status(404).json({ message: "Vente non trouvée" });
  
      // Supprimer l'historique associé
      const plat = await Plat.findById(vente.idPlat);
      if (plat) {
        for (const ingredient of plat.ingredients) {
          const stock = await Stock.findById(ingredient.stockId);
          if (stock) {
            const quantityUsed = Number(ingredient.quantity) * vente.quantite;
            stock.consumptionHistory = stock.consumptionHistory.filter(h => !(h.date.getTime() === vente.date.getTime() && h.idPlats === vente.idPlat && h.quantityUsed === quantityUsed));
            stock.quantiteConsomee -= quantityUsed;
            await stock.save();
          }
        }
      }
  
      for (const supp of vente.supplementaires) {
        const stock = await Stock.findById(supp.stockId);
        if (stock) {
          stock.consumptionHistory = stock.consumptionHistory.filter(h => !(h.date.getTime() === vente.date.getTime() && h.idPlats === vente.idPlat && h.quantityUsed === supp.quantite));
          stock.quantiteConsomee -= supp.quantite;
          await stock.save();
        }
      }
  
      res.json({ message: "Vente supprimée" });
    } catch (err) {
      console.error("❌ Erreur lors de la suppression de la vente :", err);
      res.status(500).json({ message: err.message });
    }
  };
  