const express = require('express');
const router = express.Router();
const platController = require('../controllers/platController');

router.post('/create', platController.createPlat);
router.get('/getALl', platController.getAllPlats);
router.get('/:id', platController.getPlatById);
router.put('/:id', platController.updatePlat);
router.delete('/:id', platController.deletePlat);

module.exports = router;
