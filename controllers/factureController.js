const Facture = require('../models/Facture');

// ➕ Créer une facture
exports.createFacture = async (req, res) => {
    try {
      const { name, note, total, type, createdAt } = req.body;
  
      // Remplacer le chemin absolu par un chemin relatif depuis le dossier racine
      const filePath = req.file?.path ? req.file.path.replace(/.*uploads[\\/]/, 'uploads/') : null;
  
      if (!filePath) {
        return res.status(400).json({ message: "Fichier requis." });
      }
  
      const facture = new Facture({ name, note, total, type, createdAt, filePath });
      await facture.save();
  
  
      res.status(201).json(facture);
    } catch (err) {
      console.error("❌ Erreur lors de la création de la facture :", err);
      res.status(500).json({ message: err.message });
    }
  };
  
  

// 📄 Obtenir toutes les factures
exports.getAllFactures = async (req, res) => {
  try {
    const factures = await Facture.find().sort({ createdAt: -1 });
    res.json(factures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Obtenir une facture par ID
exports.getFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) return res.status(404).json({ message: "Facture non trouvée." });
    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔄 Modifier une facture
exports.updateFacture = async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) updates.filePath = req.file.path;

    const facture = await Facture.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!facture) return res.status(404).json({ message: "Facture non trouvée." });

    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ Supprimer une facture
exports.deleteFacture = async (req, res) => {
  try {
    const facture = await Facture.findByIdAndDelete(req.params.id);
    if (!facture) return res.status(404).json({ message: "Facture non trouvée." });
    res.json({ message: "Facture supprimée." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
