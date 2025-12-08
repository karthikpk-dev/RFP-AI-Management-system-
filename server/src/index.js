require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const rfpRoutes = require('./routes/rfpRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const proposalRoutes = require('./routes/proposalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
    res.json({ message: 'RFP Management System API' });
});

// RFP routes
app.use('/api/rfps', rfpRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Proposal routes
app.use('/api/proposals', proposalRoutes);

// Database connection and server start
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
