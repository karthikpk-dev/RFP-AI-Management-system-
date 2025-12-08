'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('proposals', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            rfp_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'rfps',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            vendor_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'vendors',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            email_content: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            extracted_data_json: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {}
            },
            score: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true
            },
            summary: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            received_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create indexes for common queries
        await queryInterface.addIndex('proposals', ['rfp_id']);
        await queryInterface.addIndex('proposals', ['vendor_id']);
        await queryInterface.addIndex('proposals', ['score']);
        await queryInterface.addIndex('proposals', ['received_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('proposals');
    }
};
