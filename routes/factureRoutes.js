const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const factureController = require('../controllers/factureController');

// 📁 Assurer que le dossier "uploads" existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 📁 Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes CRUD
router.post('/create', upload.single('file'), factureController.createFacture);
router.get('/getAll', factureController.getAllFactures);
router.get('/:id', factureController.getFactureById);
router.put('/:id', upload.single('file'), factureController.updateFacture);
router.delete('/:id', factureController.deleteFacture);

module.exports = router;
