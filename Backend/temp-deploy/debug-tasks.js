const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function debugTasks() {
  console.log('=== DEBUGGING TASK ASSIGNMENTS ===\n');

  try {
    // 1. Get all tasks
    console.log('1. Fetching all tasks...');
    const tasksResult = await docClient.send(new ScanCommand({
      TableName: 'HRMS-Task-Management'
    }));

    const allItems = tasksResult.Items || [];
    const tasks = allItems.filter(item => !item.type || item.type !== 'RATING');
    const ratings = allItems.filter(item => item.type === 'RATING');

    console.log(`Found ${tasks.length} tasks and ${ratings.length} ratings\n`);

    if (tasks.length > 0) {
      console.log('Tasks:');
      tasks.forEach(task => {
        console.log(`  - Task: ${task.title}`);
        console.log(`    Task ID: ${task.taskId}`);
        console.log(`    Recruiter ID: ${task.recruiterId}`);
        console.log(`    Employee ID: ${task.employeeId || 'NOT SET'}`);
        console.log(`    Employee Email: ${task.employeeEmail || 'NOT SET'}`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Assigned By: ${task.assignedByName || 'Unknown'}`);
        console.log('');
      });
    }

    // 2. Get all employee users
    console.log('\n2. Fetching all employee users...');
    const employeeUsersResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users'
    }));

    const employeeUsers = employeeUsersResult.Items || [];
    console.log(`Found ${employeeUsers.length} employee users\n`);

    employeeUsers.forEach(emp => {
      console.log(`  - Email: ${emp.email}`);
      console.log(`    Employee ID: ${emp.employeeId}`);
      console.log(`    Company ID: ${emp.companyId}`);
      console.log(`    Active: ${emp.isActive}`);
      console.log('');
    });

    // 3. Check task visibility for each employee
    console.log('\n3. Checking task visibility for each employee...\n');
    
    employeeUsers.forEach(emp => {
      const visibleTasks = tasks.filter(task => 
        task.recruiterId === emp.companyId && 
        (task.employeeId === emp.employeeId || task.employeeEmail === emp.email)
      );

      console.log(`Employee: ${emp.email} (ID: ${emp.employeeId}, Company: ${emp.companyId})`);
      console.log(`  Should see ${visibleTasks.length} task(s):`);
      
      if (visibleTasks.length > 0) {
        visibleTasks.forEach(task => {
          console.log(`    ✅ ${task.title} (Status: ${task.status})`);
        });
      } else {
        console.log(`    ⚠️  No tasks visible`);
        
        // Check why no tasks are visible
        const tasksForRecruiter = tasks.filter(t => t.recruiterId === emp.companyId);
        if (tasksForRecruiter.length === 0) {
          console.log(`    Reason: No tasks exist for this recruiter (${emp.companyId})`);
        } else {
          console.log(`    Reason: Tasks exist for recruiter but not assigned to this employee`);
          console.log(`    Available tasks for this recruiter:`);
          tasksForRecruiter.forEach(t => {
            console.log(`      - ${t.title} (assigned to: ${t.employeeId || t.employeeEmail || 'NONE'})`);
          });
        }
      }
      console.log('');
    });

    // 4. Check for orphaned tasks (tasks with no matching employee)
    console.log('\n4. Checking for orphaned tasks...\n');
    
    tasks.forEach(task => {
      const matchingEmployee = employeeUsers.find(emp => 
        emp.companyId === task.recruiterId && 
        (emp.employeeId === task.employeeId || emp.email === task.employeeEmail)
      );

      if (!matchingEmployee) {
        console.log(`⚠️  Orphaned task: ${task.title}`);
        console.log(`   Task ID: ${task.taskId}`);
        console.log(`   Recruiter ID: ${task.recruiterId}`);
        console.log(`   Assigned to Employee ID: ${task.employeeId || 'NOT SET'}`);
        console.log(`   Assigned to Email: ${task.employeeEmail || 'NOT SET'}`);
        console.log(`   No matching employee found!`);
        console.log('');
      }
    });

    // 5. Summary by recruiter
    console.log('\n5. Summary by Recruiter:\n');
    
    const recruiterGroups = {};
    tasks.forEach(task => {
      if (!recruiterGroups[task.recruiterId]) {
        recruiterGroups[task.recruiterId] = {
          tasks: [],
          employees: []
        };
      }
      recruiterGroups[task.recruiterId].tasks.push(task);
    });

    employeeUsers.forEach(emp => {
      if (!recruiterGroups[emp.companyId]) {
        recruiterGroups[emp.companyId] = {
          tasks: [],
          employees: []
        };
      }
      recruiterGroups[emp.companyId].employees.push(emp);
    });

    Object.keys(recruiterGroups).forEach(recruiterId => {
      const group = recruiterGroups[recruiterId];
      console.log(`Recruiter ID: ${recruiterId}`);
      console.log(`  Tasks: ${group.tasks.length}`);
      console.log(`  Employees: ${group.employees.length}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTasks();
