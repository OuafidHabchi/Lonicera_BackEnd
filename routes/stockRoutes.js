const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/', stockController.getAllStocks);
router.get('/:id/details', stockController.getStockDetails);
router.post('/', stockController.createStock);
router.put('/:id', stockController.updateStock);
router.delete('/:id', stockController.deleteStock);
router.post('/:id/add-quantity', stockController.addStockQuantity);

module.exports = router;
