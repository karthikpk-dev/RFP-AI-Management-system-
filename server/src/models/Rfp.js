'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Rfp = sequelize.define('Rfp', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        natural_language_query: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        structured_json_data: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        budget: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'draft'
        }
    }, {
        tableName: 'rfps',
        underscored: true,
        timestamps: true
    });

    return Rfp;
};
