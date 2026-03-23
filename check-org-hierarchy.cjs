/**
 * Diagnostic Script: Check Organization Hierarchy
 * 
 * This script helps diagnose issues with the organization hierarchy
 * and employee-manager relationships.
 */

const { dynamoClient, isUsingMockDB, mockDB, HRMS_ORGANIZATION_CHART_TABLE, HRMS_EMPLOYEES_TABLE } = require('./Backend/config/dynamodb-wrapper');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

async function checkOrganizationHierarchy() {
  console.log('\n🔍 ORGANIZATION HIERARCHY DIAGNOSTIC TOOL\n');
  console.log('=' .repeat(60));

  try {
    // Get all organization nodes
    let orgNodes;
    if (isUsingMockDB()) {
      orgNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE
      });
      const result = await dynamoClient.send(scanCommand);
      orgNodes = result.Items || [];
    }

    console.log(`\n📊 Total Organization Nodes: ${orgNodes.length}\n`);

    if (orgNodes.length === 0) {
      console.log('⚠️  WARNING: No organization nodes found!');
      console.log('   Please create an organization hierarchy first.\n');
      return;
    }

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

    console.log(`👥 Total Employees: ${employees.length}\n`);

    // Create employee lookup map
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // Analyze each node
    console.log('📋 ORGANIZATION STRUCTURE:\n');
    
    const nodeMap = {};
    orgNodes.forEach(node => {
      nodeMap[node.nodeId] = node;
    });

    // Find root nodes (nodes without parents)
    const rootNodes = orgNodes.filter(node => !node.parentId);
    
    console.log(`🌳 Root Nodes: ${rootNodes.length}\n`);

    // Function to print hierarchy
    function printNode(node, level = 0) {
      const indent = '  '.repeat(level);
      const employee = employeeMap[node.employeeId];
      
      if (employee) {
        console.log(`${indent}├─ ${employee.fullName} (${employee.designation})`);
        console.log(`${indent}│  └─ Employee ID: ${node.employeeId}`);
        console.log(`${indent}│  └─ Node ID: ${node.nodeId}`);
      } else if (node.employeeId) {
        console.log(`${indent}├─ ⚠️  MISSING EMPLOYEE (ID: ${node.employeeId})`);
        console.log(`${indent}│  └─ Node ID: ${node.nodeId}`);
      } else {
        console.log(`${indent}├─ ${node.position || 'Unnamed Position'}`);
        console.log(`${indent}│  └─ Node ID: ${node.nodeId} (No employee assigned)`);
      }

      // Find and print children
      const children = orgNodes.filter(n => n.parentId === node.nodeId);
      children.forEach((child, index) => {
        if (index === children.length - 1) {
          console.log(`${indent}│`);
        }
        printNode(child, level + 1);
      });
    }

    // Print each root node and its hierarchy
    rootNodes.forEach((rootNode, index) => {
      printNode(rootNode);
      if (index < rootNodes.length - 1) {
        console.log('');
      }
    });

    // Check for employees not in org chart
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 EMPLOYEES NOT IN ORGANIZATION CHART:\n');
    
    const employeesInOrg = new Set(orgNodes.map(n => n.employeeId).filter(Boolean));
    const employeesNotInOrg = employees.filter(emp => !employeesInOrg.has(emp.employeeId));

    if (employeesNotInOrg.length === 0) {
      console.log('✅ All employees are assigned to the organization chart!\n');
    } else {
      console.log(`⚠️  ${employeesNotInOrg.length} employee(s) not in organization chart:\n`);
      employeesNotInOrg.forEach(emp => {
        console.log(`   • ${emp.fullName} (${emp.designation}) - ID: ${emp.employeeId}`);
      });
      console.log('\n💡 TIP: Add these employees to the organization chart to enable manager hierarchy.\n');
    }

    // Check for orphaned nodes
    console.log('='.repeat(60));
    console.log('\n🔍 ORPHANED NODES (nodes with invalid parent references):\n');
    
    const orphanedNodes = orgNodes.filter(node => {
      if (!node.parentId) return false;
      return !nodeMap[node.parentId];
    });

    if (orphanedNodes.length === 0) {
      console.log('✅ No orphaned nodes found!\n');
    } else {
      console.log(`⚠️  ${orphanedNodes.length} orphaned node(s) found:\n`);
      orphanedNodes.forEach(node => {
        const employee = employeeMap[node.employeeId];
        const name = employee ? employee.fullName : node.position || 'Unknown';
        console.log(`   • ${name} - Node ID: ${node.nodeId}, Invalid Parent ID: ${node.parentId}`);
      });
      console.log('\n💡 TIP: Fix these nodes by updating their parent references.\n');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('\n❌ Error running diagnostic:', error);
    console.error(error.stack);
  }
}

// Run the diagnostic
checkOrganizationHierarchy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
