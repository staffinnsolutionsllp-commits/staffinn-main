/**
 * Quick Fix Script: Add Employees to Organization Chart
 * Run from Backend directory: node scripts/add-employees-to-org.cjs
 */

const { dynamoClient, isUsingMockDB, mockDB, HRMS_ORGANIZATION_CHART_TABLE, HRMS_EMPLOYEES_TABLE } = require('../config/dynamodb-wrapper');
const { ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp } = require('../utils/hrmsHelpers');

async function addEmployeesToOrgChart() {
  console.log('\n🔧 QUICK FIX: Adding Employees to Organization Chart\n');
  console.log('=' .repeat(60));

  try {
    // Get all employees
    let employees;
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE
      });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    console.log(`\n👥 Found ${employees.length} employees\n`);

    if (employees.length === 0) {
      console.log('⚠️  No employees found in the system!');
      return;
    }

    // Get existing org nodes
    let existingNodes;
    if (isUsingMockDB()) {
      existingNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE
      });
      const result = await dynamoClient.send(scanCommand);
      existingNodes = result.Items || [];
    }

    console.log(`📊 Found ${existingNodes.length} existing organization nodes\n`);

    // Find employees already in org chart
    const employeesInOrg = new Set(existingNodes.map(n => n.employeeId).filter(Boolean));
    const employeesNotInOrg = employees.filter(emp => !employeesInOrg.has(emp.employeeId));

    if (employeesNotInOrg.length === 0) {
      console.log('✅ All employees are already in the organization chart!\n');
      return;
    }

    console.log(`⚠️  ${employeesNotInOrg.length} employee(s) not in organization chart:\n`);
    employeesNotInOrg.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.fullName} (${emp.designation}) - ID: ${emp.employeeId}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🔨 Creating organization nodes...\n');

    // Find or create root node
    let rootNode = existingNodes.find(n => !n.parentId);
    
    if (!rootNode) {
      console.log('📌 No root node found. Creating CEO/Owner node...\n');
      
      // Find the first employee to be CEO (you can modify this logic)
      const ceoEmployee = employees[0];
      
      rootNode = {
        nodeId: generateId(),
        recruiterId: ceoEmployee.recruiterId,
        employeeId: ceoEmployee.employeeId,
        level: 0,
        position: 'CEO / Owner',
        children: [],
        createdAt: getCurrentTimestamp(),
        createdBy: 'system'
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, rootNode);
      } else {
        const command = new PutCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          Item: rootNode
        });
        await dynamoClient.send(command);
      }

      console.log(`✅ Created root node for: ${ceoEmployee.fullName}\n`);
      employeesInOrg.add(ceoEmployee.employeeId);
    } else {
      console.log(`✅ Root node exists: ${rootNode.position || 'Unnamed'}\n`);
    }

    // Add remaining employees as children of root
    let addedCount = 0;
    for (const employee of employeesNotInOrg) {
      if (employeesInOrg.has(employee.employeeId)) {
        continue; // Skip if already added (like CEO)
      }

      const newNode = {
        nodeId: generateId(),
        recruiterId: employee.recruiterId,
        employeeId: employee.employeeId,
        parentId: rootNode.nodeId,
        level: 1,
        position: employee.designation || 'Employee',
        children: [],
        createdAt: getCurrentTimestamp(),
        createdBy: 'system'
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, newNode);
        
        // Update root node's children
        rootNode.children.push(newNode.nodeId);
        mockDB().put(HRMS_ORGANIZATION_CHART_TABLE, rootNode);
      } else {
        const command = new PutCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          Item: newNode
        });
        await dynamoClient.send(command);
      }

      console.log(`   ✅ Added: ${employee.fullName} (${employee.designation})`);
      addedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 Successfully added ${addedCount} employee(s) to organization chart!\n`);
    console.log('📝 Note: All employees have been added under the root node.');
    console.log('💡 You can now reorganize them in the HRMS admin panel.\n');
    console.log('🔄 Next steps:');
    console.log('   1. Refresh your browser (Ctrl + F5)');
    console.log('   2. Go to Grievances module');
    console.log('   3. Test submitting a grievance\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }
}

// Run the script
addEmployeesToOrgChart()
  .then(() => {
    console.log('✅ Script completed!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
