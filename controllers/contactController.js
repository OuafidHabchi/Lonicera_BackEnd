const Contact = require("../models/contactModel");
const SibApiV3Sdk = require('sib-api-v3-sdk');


exports.createContact = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    const newContact = new Contact({ fullName, email, phone, message });
    await newContact.save();

    // Configurer Brevo
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Email envoyé à Lonicera
    const sendSmtpEmailToLonicera = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmailToLonicera.sender = {
      name: "Message -Chèvrefeuille Lonicera",
      email: "loniceramtl@gmail.com"
    };
    sendSmtpEmailToLonicera.to = [
      {
        email: "loniceramtl@gmail.com",
        name: "Chèvrefeuille Lonicera"
      }
    ];
    sendSmtpEmailToLonicera.subject = `Nouveau message de contact de ${fullName}`;
    sendSmtpEmailToLonicera.htmlContent = `
      <h3>Bonjour Chèvrefeuille Lonicera,</h3>
      <p>Un nouveau message de contact a été soumis :</p>
      <h4>Détails du contact :</h4>
      <ul>
        <li><strong>Nom :</strong> ${fullName}</li>
        <li><strong>Email :</strong> ${email}</li>
        <li><strong>Téléphone :</strong> ${phone}</li>
        <li><strong>Message :</strong> ${message}</li>
      </ul>
      <hr>
      <p>Merci de vérifier votre tableau de bord pour une réponse rapide.</p>
      <p>Cordialement</p>
    `;
    await apiInstance.sendTransacEmail(sendSmtpEmailToLonicera);

    // Email envoyé au client
    const sendSmtpEmailToClient = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmailToClient.sender = {
      name: "Chèvrefeuille Lonicera",
      email: "loniceramtl@gmail.com"
    };
    sendSmtpEmailToClient.to = [
      {
        email: email,
        name: fullName
      }
    ];
    sendSmtpEmailToClient.subject = "Accusé de réception de votre message";
    sendSmtpEmailToClient.htmlContent = `
      <h3>Bonjour ${fullName},</h3>
      <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés. Nous allons répondre à votre demande dans les plus brefs délais.</p>

      <h4>Votre message :</h4>
      <p><strong>${message}</strong></p>

      <hr>
      <p>Cordialement,</p>
      <p>L'équipe Chèvrefeuille Lonicera</p>
      <p><strong>English:</strong></p>
      <h3>Hello ${fullName},</h3>
      <p>We have received your message, and we thank you for reaching out to us. We will respond to your inquiry as soon as possible.</p>
      <h4>Your message:</h4>
      <p><strong>${message}</strong></p>
      <hr>
      <p>Best regards,</p>
      <p>The Chèvrefeuille Lonicera Team</p>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmailToClient);

    res.status(201).json({ message: "Message de contact enregistré, notification envoyée à Lonicera et à votre client." });
  } catch (error) {
    console.error('Erreur lors de la création du contact :', error);
    res.status(500).json({ error: error.message });
  }
};



exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.markAsSeen = async (req, res) => {
  const { messageId, userName } = req.body;

  try {
    const contacts = await Contact.findByIdAndUpdate(messageId, {
      $addToSet: { Seen: userName }, // ajoute uniquement si non présent
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};
