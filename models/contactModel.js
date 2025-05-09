const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  Seen: [{ type: String, }], // liste des noms des utilisateurs qui ont vu l'estimation  replay :{type:Boolean}, 
  replayMessage:{type :String},
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contact', contactSchema);

