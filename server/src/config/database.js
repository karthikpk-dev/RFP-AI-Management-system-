require('dotenv').config();

module.exports = {
    development: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: console.log,
        define: {
            timestamps: true,
            underscored: true
        }
    },
    test: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: false,
        define: {
            timestamps: true,
            underscored: true
        }
    },
    production: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: false,
        define: {
            timestamps: true,
            underscored: true
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
