const { createEmployeeDeviceMappingTable } = require('./create-employee-device-mapping-table');
const { createDevicesTable } = require('./create-devices-table');

async function setupAllTables() {
    console.log('🚀 Setting up all HRMS attendance tables...\n');

    try {
        console.log('1️⃣ Creating employee-device mapping table...');
        await createEmployeeDeviceMappingTable();
        console.log('');

        console.log('2️⃣ Creating devices table...');
        await createDevicesTable();
        console.log('');

        console.log('✅ All tables created successfully!');
        console.log('\n📋 Tables created:');
        console.log('   - staffinn-hrms-employee-device-mappings');
        console.log('   - staffinn-hrms-devices');
        console.log('\n🎉 Database setup complete!');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    setupAllTables()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { setupAllTables };
