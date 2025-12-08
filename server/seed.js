/**
 * Seed script to populate database with dummy vendors for demo
 * 
 * Usage: npm run seed --workspace=server
 */

require('dotenv').config();
const { sequelize, Vendor } = require('./src/models');

const dummyVendors = [
    {
        name: 'TechPro Solutions',
        email: 'sales@techpro.example.com',
        contact_info: {
            phone: '+1-555-0101',
            company: 'TechPro Solutions Inc.',
            address: '123 Tech Park, Silicon Valley, CA'
        }
    },
    {
        name: 'Global IT Supplies',
        email: 'quotes@globalit.example.com',
        contact_info: {
            phone: '+1-555-0102',
            company: 'Global IT Supplies Ltd.',
            address: '456 Commerce St, New York, NY'
        }
    },
    {
        name: 'Premium Hardware Co',
        email: 'orders@premiumhw.example.com',
        contact_info: {
            phone: '+1-555-0103',
            company: 'Premium Hardware Corporation',
            address: '789 Enterprise Blvd, Austin, TX'
        }
    }
];

async function seed() {
    try {
        console.log('🌱 Starting database seed...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Seed vendors
        console.log('📦 Seeding vendors...');
        for (const vendor of dummyVendors) {
            // Check if vendor already exists
            const existing = await Vendor.findOne({ where: { email: vendor.email } });
            if (existing) {
                console.log(`  ⏭️  Skipped: ${vendor.name} (already exists)`);
            } else {
                await Vendor.create(vendor);
                console.log(`  ✅ Created: ${vendor.name}`);
            }
        }

        console.log('\n🎉 Seed completed successfully!\n');
        console.log('Vendors in database:');
        const allVendors = await Vendor.findAll();
        allVendors.forEach(v => console.log(`  - ${v.name} <${v.email}>`));

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
