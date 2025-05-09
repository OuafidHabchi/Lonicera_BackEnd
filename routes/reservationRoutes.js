const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

router.post("/create", reservationController.createReservation);
router.get("/getAll", reservationController.getAllReservations);
router.patch('/mark-seen', reservationController.markAsSeen);

router.patch('/confirm', reservationController.confirmReservation);
router.patch('/refuse', reservationController.refuseReservation);
router.get('/:id/:token', reservationController.getReservationByToken);
// Route pour répondre à la réservation (confirmer ou refuser)
router.post('/respond', reservationController.respondToReservation);
router.get('/resver/date/:date',reservationController.getReservationsByDate);

router.get('/reservations', reservationController.getByDateRange);






module.exports = router;
