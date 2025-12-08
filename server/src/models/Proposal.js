'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Proposal = sequelize.define('Proposal', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        rfp_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'rfps',
                key: 'id'
            }
        },
        vendor_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'vendors',
                key: 'id'
            }
        },
        email_content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        extracted_data_json: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        received_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        email_message_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true
        }
    }, {
        tableName: 'proposals',
        underscored: true,
        timestamps: true
    });

    Proposal.associate = (models) => {
        Proposal.belongsTo(models.Rfp, { foreignKey: 'rfp_id', as: 'rfp' });
        Proposal.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    };

    return Proposal;
};
