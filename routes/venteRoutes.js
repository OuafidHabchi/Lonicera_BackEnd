const express = require('express');
const router = express.Router();
const venteController = require('../controllers/venteController');

router.post('/', venteController.createVente);
router.get('/', venteController.getAllVentes);
router.get('/:id', venteController.getVenteById);
router.put('/:id', venteController.updateVente);
router.delete('/:id', venteController.deleteVente);

module.exports = router;
