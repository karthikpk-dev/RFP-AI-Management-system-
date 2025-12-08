'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions || {}
});

// Import models
const Rfp = require('./Rfp')(sequelize);
const Vendor = require('./Vendor')(sequelize);
const Proposal = require('./Proposal')(sequelize);

// Set up associations
Proposal.belongsTo(Rfp, { foreignKey: 'rfp_id', as: 'rfp' });
Proposal.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Rfp.hasMany(Proposal, { foreignKey: 'rfp_id', as: 'proposals' });
Vendor.hasMany(Proposal, { foreignKey: 'vendor_id', as: 'proposals' });

const db = {
    sequelize,
    Sequelize,
    Rfp,
    Vendor,
    Proposal
};

module.exports = db;
