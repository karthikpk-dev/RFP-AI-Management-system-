'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Vendor = sequelize.define('Vendor', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        contact_info: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        tableName: 'vendors',
        underscored: true,
        timestamps: true
    });

    return Vendor;
};
