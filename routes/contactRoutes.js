const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

router.post("/Create", contactController.createContact);
router.get("/getAll", contactController.getAllContacts);
router.patch('/mark-seen', contactController.markAsSeen);


module.exports = router;
