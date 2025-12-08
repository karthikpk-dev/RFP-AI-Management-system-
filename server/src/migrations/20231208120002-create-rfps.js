'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('rfps', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            natural_language_query: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            structured_json_data: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {}
            },
            budget: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'draft'
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
        await queryInterface.addIndex('rfps', ['status']);
        await queryInterface.addIndex('rfps', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('rfps');
    }
};
