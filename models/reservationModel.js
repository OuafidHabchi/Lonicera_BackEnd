const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  guests: { type: Number, default: 2, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  Seen: [{ type: String, }], // liste des noms des utilisateurs qui ont vu l'estimation
  preferredLanguage: { type: String, required: true },
  contactMethod: { type: String, required: true },
  confirmationToken: { type: String, required: true },
  ConfirmationSent: { type: Boolean },
  Confirmation: { type: Boolean },
  ConfirmedBy: { type: String,},
  ConfirmationDate: { type: String,  },
  ClientConfirmation:{type : Boolean},

}, {
  timestamps: true,
});

module.exports = mongoose.model('Reservation', reservationSchema);
