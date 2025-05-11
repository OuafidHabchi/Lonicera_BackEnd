const express = require("express");
const cors = require("cors");
require('dotenv').config();
const path = require('path');
const connectDB = require("./config/db");
const contactRoutes = require("./routes/contactRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const employeeRoutes = require('./routes/employeeRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const stockRoutes = require('./routes/stockRoutes');
const platRoutes = require('./routes/platRoutes');
const venteRoutes = require('./routes/venteRoutes');
const factureRoutes = require('./routes/factureRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use("/api/ContactUs", contactRoutes);
app.use("/api/reservations", reservationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/plats', platRoutes);
app.use('/api/ventes', venteRoutes);
app.use('/api/factures', factureRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
