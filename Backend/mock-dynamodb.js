/**
 * Mock DynamoDB Service
 * Provides in-memory storage to replace DynamoDB Local when Java is not available
 */

const fs = require('fs');
const path = require('path');

class MockDynamoDB {
  constructor() {
    this.tables = new Map();
    this.dataFile = path.join(__dirname, 'mock-dynamodb-data.json');
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        // Convert loaded data to Maps
        this.tables = new Map();
        Object.entries(data).forEach(([tableName, tableData]) => {
          this.tables.set(tableName, new Map(Object.entries(tableData || {})));
        });
      }
    } catch (error) {
      console.log('Starting with empty mock database');
    }
  }

  saveData() {
    try {
      const data = {};
      this.tables.forEach((table, tableName) => {
        data[tableName] = Object.fromEntries(table);
      });
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving mock database:', error);
    }
  }

  createTable(tableName) {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new Map());
      this.saveData();
    }
  }

  putItem(tableName, item) {
    this.createTable(tableName);
    const table = this.tables.get(tableName);
    const key = item.quizprogressId || item.id || item.userId || item.email || item.recruiterNewsID || item.issuesection || item.adminId || Date.now().toString();
    table.set(key, item);
    this.saveData();
    return { success: true };
  }

  getItem(tableName, keyObj) {
    const table = this.tables.get(tableName);
    if (!table) return null;
    
    // Handle different key formats
    let key;
    if (typeof keyObj === 'string') {
      key = keyObj;
    } else if (keyObj.quizprogressId) {
      key = keyObj.quizprogressId;
    } else if (keyObj.userId) {
      key = keyObj.userId;
    } else if (keyObj.issuesection) {
      key = keyObj.issuesection;
    } else if (keyObj.adminId) {
      key = keyObj.adminId;
    } else if (keyObj.email) {
      key = keyObj.email;
    } else {
      key = Object.values(keyObj)[0];
    }
    
    return table.get(key) || null;
  }

  scan(tableName, limit = 100) {
    const table = this.tables.get(tableName);
    if (!table) return [];
    const items = Array.from(table.values()).slice(0, limit);
    return items;
  }

  scanItems(tableName, params = {}) {
    const table = this.tables.get(tableName);
    if (!table) return [];
    
    let items = Array.from(table.values());
    
    // Apply filter if provided
    if (params.FilterExpression && params.ExpressionAttributeValues) {
      const filterExpr = params.FilterExpression;
      const values = params.ExpressionAttributeValues;
      
      // Simple filter implementation for userId and courseId
      if (filterExpr.includes('userId = :userId') && filterExpr.includes('courseId = :courseId')) {
        const userId = values[':userId'];
        const courseId = values[':courseId'];
        items = items.filter(item => item.userId === userId && item.courseId === courseId);
      }
    }
    
    return items.slice(0, params.Limit || 100);
  }

  query(tableName, keyCondition, limit = 100) {
    const table = this.tables.get(tableName);
    if (!table) return [];
    
    // Simple query implementation
    const items = Array.from(table.values());
    return items.slice(0, limit);
  }

  deleteItem(tableName, keyObj) {
    const table = this.tables.get(tableName);
    if (table) {
      // Handle different key formats
      let key;
      if (typeof keyObj === 'string') {
        key = keyObj;
      } else if (keyObj.userId) {
        key = keyObj.userId;
      } else if (keyObj.issuesection) {
        key = keyObj.issuesection;
      } else if (keyObj.adminId) {
        key = keyObj.adminId;
      } else if (keyObj.email) {
        key = keyObj.email;
      } else {
        key = Object.values(keyObj)[0];
      }
      
      table.delete(key);
      this.saveData();
    }
    return { success: true };
  }

  updateItem(tableName, keyObj, updates) {
    const table = this.tables.get(tableName);
    if (table) {
      // Handle different key formats
      let key;
      if (typeof keyObj === 'string') {
        key = keyObj;
      } else if (keyObj.userId) {
        key = keyObj.userId;
      } else if (keyObj.issuesection) {
        key = keyObj.issuesection;
      } else if (keyObj.adminId) {
        key = keyObj.adminId;
      } else if (keyObj.email) {
        key = keyObj.email;
      } else {
        key = Object.values(keyObj)[0];
      }
      
      if (table.has(key)) {
        const item = table.get(key);
        Object.assign(item, updates);
        table.set(key, item);
        this.saveData();
        return item;
      }
    }
    return null;
  }
}

const mockDB = new MockDynamoDB();

// Initialize with sample data
mockDB.createTable('staffinn-users');
mockDB.createTable('staffinn-staff-profiles');
mockDB.createTable('staffinn-institute-profiles');
mockDB.createTable('staffinn-institute-students');
mockDB.createTable('staffinn-institute-courses');
mockDB.createTable('staffinn-jobs');
mockDB.createTable('staffinn-job-applications');
mockDB.createTable('recruiter-news');
mockDB.createTable('staffinn-issue-section');
mockDB.createTable('staffinn-admin');
mockDB.createTable('user-quiz-progress');

module.exports = mockDB;