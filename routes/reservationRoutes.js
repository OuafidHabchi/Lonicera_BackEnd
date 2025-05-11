const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

router.post("/create", reservationController.createReservation);
router.get("/getAll", reservationController.getAllReservations);
router.patch('/mark-seen', reservationController.markAsSeen);

router.patch('/confirm', reservationController.confirmReservation);
router.patch('/refuse', reservationController.refuseReservation);
router.get('/resver/date/:date',reservationController.getReservationsByDate);
router.get('/reservations', reservationController.getByDateRange);
// Routes pour l'annulation des réservations
router.get('/find', reservationController.findReservations);
router.post('/cancel',reservationController.cancelReservation);





module.exports = router;
