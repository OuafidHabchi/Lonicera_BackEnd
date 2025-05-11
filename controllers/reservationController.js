const Reservation = require('../models/reservationModel');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require('crypto');
const axios = require('axios');
const moment = require("moment");




exports.createReservation = async (req, res) => {
    try {
        const { fullName, phone, email, guests, date, time, preferredLanguage, contactMethod } = req.body;
        const confirmationToken = crypto.randomBytes(20).toString('hex')
        const reservation = new Reservation({
            fullName, phone, email, guests, date, time, confirmationToken, preferredLanguage, contactMethod
        });

        await reservation.save();
        // Setup Brevo
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        // Email à Lonicera
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = {
            name: "réservation - Chèvrefeuille Lonicera",
            email: "loniceramtl@gmail.com"
        };
        sendSmtpEmail.to = [{ email: "loniceramtl@gmail.com", name: "Chèvrefeuille Lonicera" }];
        sendSmtpEmail.subject = "Nouvelle réservation reçue";
        sendSmtpEmail.htmlContent = `
            <h3>Bonjour Chèvrefeuille Lonicera !</h3>
            <p>Une nouvelle réservation a été enregistrée :</p>
            <ul>
                <li><strong>Nom :</strong> ${fullName}</li>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Téléphone :</strong> ${phone}</li>
            </ul>
            <ul>
                <li><strong>Nombre de personnes :</strong> ${guests}</li>
                <li><strong>Date :</strong> ${date}</li>
                <li><strong>Heure :</strong> ${time}</li>
            </ul>
            <p>Cordialement,<br>L'équipe Chèvrefeuille Lonicera</p>
        `;
        try {
            await apiInstance.sendTransacEmail(sendSmtpEmail);
        } catch (err) {
            console.error("❌ Erreur lors de l'envoi de l'email à Lonicera :", err);
        }

        // Message de confirmation au client
        const confirmationLink = `lonicera.ca/CancelReservation`;

        const messageFR = `Bonjour ${fullName}, votre réservation chez Chèvrefeuille Lonicera pour ${guests} personne(s) le ${date} à ${time} a bien été confirmée. Si vous souhaitez l'annuler, cliquez ici : ${confirmationLink}`;
        const messageEN = `Hello ${fullName}, your reservation at Chèvrefeuille Lonicera for ${guests} guest(s) on ${date} at ${time} has been confirmed. If you wish to cancel it, click here: ${confirmationLink}`;
        const confirmationMessage = preferredLanguage === 'fr' ? messageFR : messageEN;

        if (contactMethod === 'email' || contactMethod === 'both') {
            const confirmationLink = `lonicera.ca/CancelReservation`;

            const confirmationEmail = new SibApiV3Sdk.SendSmtpEmail();
            confirmationEmail.sender = {
                name: "Chèvrefeuille Lonicera",
                email: "loniceramtl@gmail.com"
            };
            confirmationEmail.to = [{ email: email, name: fullName }];
            confirmationEmail.subject = preferredLanguage === 'fr' ? "Confirmation de votre réservation" : "Your Reservation Confirmation";

            confirmationEmail.htmlContent = preferredLanguage === 'fr'
                ? `
                    <h2>Bonjour ${fullName},</h2>
                    <p>Votre réservation pour <strong>${guests}</strong> personne(s) le <strong>${date}</strong> à <strong>${time}</strong> a bien été enregistrée.</p>
                    <p>Si vous souhaitez annuler cette réservation, veuillez cliquer sur le lien ci-dessous :</p>
                    <p><a href="${confirmationLink}" style="background-color:#DC3545;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Annuler ma réservation</a></p>
                    <br>
                    <p>Merci et à bientôt,<br>L'équipe Chèvrefeuille Lonicera</p>
                `
                : `
                    <h2>Hello ${fullName},</h2>
                    <p>Your reservation for <strong>${guests}</strong> guest(s) on <strong>${date}</strong> at <strong>${time}</strong> has been successfully recorded.</p>
                    <p>If you wish to cancel this reservation, please click the link below:</p>
                    <p><a href="${confirmationLink}" style="background-color:#DC3545;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Cancel My Reservation</a></p>
                    <br>
                    <p>Thank you and see you soon!<br>The Chèvrefeuille Lonicera Team</p>
                `;

            try {
                await apiInstance.sendTransacEmail(confirmationEmail);
            } catch (err) {
                console.error("❌ Erreur lors de l'envoi de l'email au client :", err);
            }
        }


        // SMS via Make Webhook
        if (contactMethod === 'phone' || contactMethod === 'both') {
            try {
                const response = await axios.post('https://hook.us2.make.com/k4n3a9va4a51dmrwtpvbv52otrva5574', {
                    phone,
                    message: confirmationMessage
                });
            } catch (err) {
                console.error("❌ Erreur lors de l'envoi du SMS via Make :", err.response?.data || err.message);
            }
        }

        res.status(201).json({ message: "Réservation enregistrée avec succès. Confirmation envoyée au client." });

    } catch (error) {
        console.error("❌ Erreur lors de la création de la réservation :", error);
        res.status(500).json({ error: error.message });
    }
};



exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// GET reservations between two dates
exports.getByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const reservations = await Reservation.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: 1, time: 1 });
        
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getReservationsByDate = async (req, res) => {
    
    const MAX_CAPACITY = 18;
    const DURATION_IN_SLOTS = 3; // 1h30 = 3 créneaux de 30 min
    try {
        const { date } = req.params;
    

        if (!date) {
            return res.status(400).json({ error: "La date est requise dans les paramètres." });
        }

        // Générer les créneaux horaires entre 10:00 et 15:00 toutes les 30 minutes
        const generateTimeSlots = () => {
            const start = moment("10:00", "HH:mm");
            const end = moment("15:00", "HH:mm");
            const slots = [];

            while (start <= end) {
                slots.push(start.format("HH:mm"));
                start.add(30, "minutes");
            }

            return slots;
        };

        const timeSlots = generateTimeSlots();
        const occupancy = {};

        // Initialiser chaque créneau avec 0
        timeSlots.forEach((slot) => {
            occupancy[slot] = 0;
        });

        // Récupérer les réservations de la date
        const reservations = await Reservation.find({ date });

        // Pour chaque réservation, ajouter le nombre de personnes sur les 3 créneaux (1h30)
        reservations.forEach((res) => {
            const startTime = moment(res.time, "HH:mm");

            for (let i = 0; i < DURATION_IN_SLOTS; i++) {
                const slot = startTime.clone().add(i * 30, "minutes").format("HH:mm");

                if (occupancy.hasOwnProperty(slot)) {
                    occupancy[slot] += res.guests;
                }
            }
        });

        // Créer la réponse avec les places disponibles
        const availability = timeSlots.map((slot) => ({
            time: slot,
            availableSeats: Math.max(0, MAX_CAPACITY - occupancy[slot])
        }));

        res.status(200).json(availability);

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des disponibilités :", error);
        res.status(500).json({ error: error.message });
    }
};


exports.markAsSeen = async (req, res) => {
    const { reservationId, userName } = req.body;

    try {
        await Reservation.findByIdAndUpdate(reservationId, {
            $addToSet: { Seen: userName }, // ajoute uniquement si non présent
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err });
    }
};



exports.confirmReservation = async (req, res) => {
    const { reservationId, confirmedBy, confirmationDate } = req.body;

    try {
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée" });
        }

        // Récupérer la langue préférée du client (par défaut 'fr' si non spécifié)
        const lang = reservation.preferredLanguage || 'fr';
        // Récupérer la méthode de contact préférée (par défaut 'email' si non spécifié)
        const contactMethod = reservation.contactMethod || 'email';

        // Configuration de l'API Brevo
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        // Construction du lien de confirmation
        const confirmationLink = `https://lonicera.ca/CancelReservation`;

        const messages = {
            fr: {
                email: {
                    subject: "Votre réservation Chèvrefeuille Lonicera vous attend 🌿",
                    content: `
                        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <div style="color: #2a5a3d; font-size: 24px; margin-bottom: 20px;">Chèvrefeuille Lonicera</div>
                            
                            <p>Bonjour ${reservation.fullName},</p>
                            
                            <p>Nous sommes ravis de vous accueillir le <strong>${new Date(reservation.date).toLocaleDateString('fr-FR')} à ${reservation.time}</strong> !</p>
                            
                            <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p>Pour vous :</p>
                                <ul style="padding-left: 20px;">
                                    <li>Nos spécialités méditerranéennes fraîchement préparées</li>
                                    <li>Service personnalisé selon vos préférences</li>
                                    <li>Ambiance chaleureuse et authentique</li>
                                </ul>
                            </div>
                            
                            <p style="text-align: center; margin: 25px 0;">
                                <a href="${confirmationLink}" style="background-color: #4a8f68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                                    Tout est parfait ✔
                                </a>
                                <br>
                                <small style="color: #666;">(ou ajustez si nécessaire)</small>
                            </p>
                            
                            <p>À très vite,<br>L'équipe Chèvrefeuille Lonicera</p>
                            
                            <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                                <p>Détails de réservation : ${reservation.guests} personne(s) • ${new Date(reservation.date).toLocaleDateString('fr-FR')} • ${reservation.time}</p>
                            </div>
                        </div>
                    `
                },
                sms: {
                    content: `Chèvrefeuille Lonicera 🌿: Bonjour ${reservation.fullName}, nous préparons votre table pour le ${new Date(reservation.date).toLocaleDateString('fr-FR')} à ${reservation.time}. Confirmez en 1 clic : ${confirmationLink}`
                }
            },
            en: {
                email: {
                    subject: "Your Chèvrefeuille Lonicera Experience Awaits 🌿",
                    content: `
                        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <div style="color: #2a5a3d; font-size: 24px; margin-bottom: 20px;">Chèvrefeuille Lonicera</div>
                            
                            <p>Dear ${reservation.fullName},</p>
                            
                            <p>We're delighted to welcome you on <strong>${new Date(reservation.date).toLocaleDateString('en-US')} at ${reservation.time}</strong>!</p>
                            
                            <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p>For you:</p>
                                <ul style="padding-left: 20px;">
                                    <li>Freshly prepared Mediterranean specialties</li>
                                    <li>Service tailored to your preferences</li>
                                    <li>Warm and authentic atmosphere</li>
                                </ul>
                            </div>
                            
                            <p style="text-align: center; margin: 25px 0;">
                                <a href="${confirmationLink}" style="background-color: #4a8f68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                                    Everything's perfect ✔
                                </a>
                                <br>
                                <small style="color: #666;">(or adjust if needed)</small>
                            </p>
                            
                            <p>See you soon,<br>The Chèvrefeuille Lonicera Team</p>
                            
                            <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                                <p>Reservation details: ${reservation.guests} guest(s) • ${new Date(reservation.date).toLocaleDateString('en-US')} • ${reservation.time}</p>
                            </div>
                        </div>
                    `
                },
                sms: {
                    content: `Chèvrefeuille Lonicera 🌿: Hi ${reservation.fullName}, we're preparing your table for ${new Date(reservation.date).toLocaleDateString('en-US')} at ${reservation.time}. Confirm with 1 click: ${confirmationLink}`
                }
            }
        };

        // Envoi selon la méthode de contact préférée
        if (contactMethod === 'email' || contactMethod === 'both') {
            try {
                const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
                const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

                sendSmtpEmail.sender = {
                    name: "Chèvrefeuille Lonicera",
                    email: "loniceramtl@gmail.com"
                };

                sendSmtpEmail.to = [{
                    email: reservation.email,
                    name: reservation.fullName
                }];

                sendSmtpEmail.subject = messages[lang].email.subject;
                sendSmtpEmail.htmlContent = messages[lang].email.content;

                await apiInstance.sendTransacEmail(sendSmtpEmail);
            } catch (emailError) {
                console.error("Erreur d'envoi email:", emailError);
                // On continue même si échec email pour tenter SMS si nécessaire
            }
        }

        if ((contactMethod === 'phone' || contactMethod === 'both') && reservation.phone) {
            try {
                await axios.post('https://hook.us2.make.com/k4n3a9va4a51dmrwtpvbv52otrva5574', {
                    phone: reservation.phone,
                    message: messages[lang].sms.content
                });
            } catch (smsError) {
                console.error("Erreur d'envoi SMS:", smsError);
            }
        }

        // Mise à jour de la réservation
        await Reservation.findByIdAndUpdate(reservationId, {
            Confirmation: true,
            ConfirmedBy: confirmedBy,
            ConfirmationDate: confirmationDate || new Date(),
            lastConfirmationSent: new Date(),
            ConfirmationSent:true,
        });

        res.json({
            success: true,
            message: "Confirmation envoyée selon les préférences du client",
            details: {
                contactMethodUsed: contactMethod,
                languageUsed: lang,
                emailSent: (contactMethod === 'email' || contactMethod === 'both'),
                smsSent: (contactMethod === 'phone' || contactMethod === 'both') && !!reservation.phone
            }
        });

    } catch (err) {
        console.error("Erreur lors de la confirmation de réservation:", err);
        res.status(500).json({
            message: "Erreur serveur",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};




exports.refuseReservation = async (req, res) => {
    const { reservationId, confirmedBy, confirmationDate } = req.body;

    try {
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation non trouvée" });
        }

        const lang = reservation.preferredLanguage || 'fr';
        const contactMethod = reservation.contactMethod || 'email';

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const messages = {
            fr: {
                email: {
                    subject: "Annulation exceptionnelle de votre réservation Chèvrefeuille Lonicera",
                    content: `
                        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                            <h3>Bonjour ${reservation.fullName},</h3>

                            <p>Nous vous écrivons pour vous informer, avec regret, que nous devons exceptionnellement annuler votre réservation.</p>

                            <p>En raison d'une situation indépendante de notre volonté (fermeture exceptionnelle du restaurant ou événement majeur), nous ne serons pas en mesure de vous accueillir comme prévu.</p>

                            <h4>Détails de la réservation :</h4>
                            <ul>
                              <li><strong>Nom :</strong> ${reservation.fullName}</li>
                              <li><strong>Email :</strong> ${reservation.email}</li>
                              <li><strong>Téléphone :</strong> ${reservation.phone}</li>
                              <li><strong>Nombre de personnes :</strong> ${reservation.guests}</li>
                              <li><strong>Date :</strong> ${reservation.date}</li>
                              <li><strong>Heure :</strong> ${reservation.time}</li>
                            </ul>

                            <p>Cette annulation a été confirmée avec vous par ${confirmedBy} le ${confirmationDate}.</p>

                            <p>Nous sommes sincèrement désolés pour ce désagrément et espérons avoir le plaisir de vous accueillir très prochainement.</p>

                            <p>Cordialement,<br>L’équipe <strong>Chèvrefeuille Lonicera</strong></p>
                        </div>
                    `
                },
                sms: {
                    content: `Bonjour ${reservation.fullName}, nous sommes désolés de devoir annuler votre réservation du ${reservation.date} à ${reservation.time} en raison d'une fermeture exceptionnelle. Merci de votre compréhension. – Chèvrefeuille Lonicera`
                }
            },
            en: {
                email: {
                    subject: "Exceptional cancellation of your Chèvrefeuille Lonicera reservation",
                    content: `
                        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                            <h3>Dear ${reservation.fullName},</h3>

                            <p>We regret to inform you that we must exceptionally cancel your reservation.</p>

                            <p>Due to unforeseen circumstances (such as an exceptional closure or major event), we will not be able to welcome you as planned.</p>

                            <h4>Reservation details:</h4>
                            <ul>
                              <li><strong>Name:</strong> ${reservation.fullName}</li>
                              <li><strong>Email:</strong> ${reservation.email}</li>
                              <li><strong>Phone:</strong> ${reservation.phone}</li>
                              <li><strong>Guests:</strong> ${reservation.guests}</li>
                              <li><strong>Date:</strong> ${reservation.date}</li>
                              <li><strong>Time:</strong> ${reservation.time}</li>
                            </ul>

                            <p>This cancellation was confirmed with you by ${confirmedBy} on ${confirmationDate}.</p>

                            <p>We sincerely apologize for the inconvenience and hope to welcome you at another time.</p>

                            <p>Kind regards,<br>The <strong>Chèvrefeuille Lonicera</strong> Team</p>
                        </div>
                    `
                },
                sms: {
                    content: `Hi ${reservation.fullName}, we are very sorry to cancel your reservation on ${reservation.date} at ${reservation.time} due to an exceptional closure. Thank you for your understanding. – Chèvrefeuille Lonicera`
                }
            }
        };

        // Envoi email si autorisé
        if (contactMethod === 'email' || contactMethod === 'both') {
            try {
                const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
                const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

                sendSmtpEmail.sender = {
                    name: "Chèvrefeuille Lonicera",
                    email: "loniceramtl@gmail.com"
                };

                sendSmtpEmail.to = [{
                    email: reservation.email,
                    name: reservation.fullName
                }];

                sendSmtpEmail.subject = messages[lang].email.subject;
                sendSmtpEmail.htmlContent = messages[lang].email.content;

                await apiInstance.sendTransacEmail(sendSmtpEmail);
            } catch (emailError) {
                console.error("Erreur d'envoi email:", emailError);
            }
        }

        // Envoi SMS si autorisé
        if ((contactMethod === 'phone' || contactMethod === 'both') && reservation.phone) {
            try {
                await axios.post('https://hook.us2.make.com/k4n3a9va4a51dmrwtpvbv52otrva5574', {
                    phone: reservation.phone,
                    message: messages[lang].sms.content
                });
            } catch (smsError) {
                console.error("Erreur d'envoi SMS:", smsError);
            }
        }

        // Mise à jour de la réservation
        await Reservation.findByIdAndUpdate(reservationId, {
            Confirmation: false,
            ConfirmedBy: confirmedBy,
            ConfirmationDate: confirmationDate || new Date(),
            lastConfirmationSent: new Date(),
            ConfirmationSent:true,
        });

        res.json({
            success: true,
            message: "Annulation envoyée selon les préférences du client",
            details: {
                contactMethodUsed: contactMethod,
                languageUsed: lang,
                emailSent: (contactMethod === 'email' || contactMethod === 'both'),
                smsSent: (contactMethod === 'phone' || contactMethod === 'both') && !!reservation.phone
            }
        });

    } catch (err) {
        console.error("Erreur lors de l'annulation de la réservation:", err);
        res.status(500).json({
            message: "Erreur serveur",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Trouver les réservations par email et date
exports.findReservations = async (req, res) => {
  try {
    const { email, date } = req.query;

    // Validation basique
    if (!email || !date) {
      return res.status(400).json({
        success: false,
        message: 'Email et date sont requis.'
      });
    }

    const reservations = await Reservation.find({
      email: email,
      date: date,
      Confirmation: { $ne: false }
    }).select('-confirmationToken -Seen -__v');

    if (!Array.isArray(reservations) || reservations.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des réservations :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche des réservations.'
    });
  }
};


// Annuler une réservation
exports.cancelReservation = async (req, res) => {
  try {
    const { reservationId, phone } = req.body;

    if (!reservationId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de la réservation et le numéro de téléphone sont requis.'
      });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée.'
      });
    }

    if (reservation.phone !== phone) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone incorrect. Veuillez utiliser le numéro associé à cette réservation.'
      });
    }

    reservation.ClientConfirmation = false;
    reservation.ConfirmationDate = new Date().toISOString();
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès.',
      data: {
        id: reservation._id,
        date: reservation.date,
        time: reservation.time
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation de la réservation.'
    });
  }
};
