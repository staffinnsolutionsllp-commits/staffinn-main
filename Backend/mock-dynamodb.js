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
    const key = item.staffId || item.quizprogressId || item.id || item.userId || item.email || item.recruiterNewsID || item.issuesection || item.adminId || Date.now().toString();
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
    } else if (keyObj.staffId) {
      key = keyObj.staffId;
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
      
      // Simple filter implementation for common patterns
      if (filterExpr.includes('userId = :userId')) {
        const userId = values[':userId'];
        items = items.filter(item => item.userId === userId);
      }
      
      if (filterExpr.includes('courseId = :courseId')) {
        const courseId = values[':courseId'];
        items = items.filter(item => item.courseId === courseId);
      }
      
      if (filterExpr.includes('isActiveStaff = :isActive')) {
        const isActive = values[':isActive'];
        items = items.filter(item => item.isActiveStaff === isActive);
      }
      
      if (filterExpr.includes('profileVisibility = :visibility')) {
        const visibility = values[':visibility'];
        items = items.filter(item => item.profileVisibility === visibility);
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
      } else if (keyObj.staffId) {
        key = keyObj.staffId;
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

  updateItem(tableName, keyObj, params) {
    const table = this.tables.get(tableName);
    if (!table) {
      this.createTable(tableName);
      return null;
    }
    
    // Handle different key formats
    let key;
    if (typeof keyObj === 'string') {
      key = keyObj;
    } else if (keyObj.staffId) {
      key = keyObj.staffId;
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
    
    // Find item by key or by scanning for matching properties
    let item = table.get(key);
    if (!item) {
      // If not found by direct key, scan for matching properties
      for (const [itemKey, itemValue] of table.entries()) {
        if (typeof keyObj === 'object') {
          let matches = true;
          for (const [propKey, propValue] of Object.entries(keyObj)) {
            if (itemValue[propKey] !== propValue) {
              matches = false;
              break;
            }
          }
          if (matches) {
            item = itemValue;
            key = itemKey;
            break;
          }
        }
      }
    }
    
    if (!item) {
      return null;
    }
    
    // Handle DynamoDB update expression format
    if (params.UpdateExpression && params.ExpressionAttributeValues) {
      const updates = {};
      
      // Parse the update expression and attribute values
      if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
        // Map attribute names to actual field names
        const nameMap = params.ExpressionAttributeNames;
        const valueMap = params.ExpressionAttributeValues;
        
        // Extract updates from the expression
        Object.entries(nameMap).forEach(([placeholder, fieldName]) => {
          const valuePlaceholder = placeholder.replace('#attr', ':val');
          if (valueMap[valuePlaceholder] !== undefined) {
            updates[fieldName] = valueMap[valuePlaceholder];
          }
        });
      }
      
      // Apply updates
      Object.assign(item, updates);
    } else {
      // Handle simple object updates
      Object.assign(item, params);
    }
    
    // Update timestamp
    item.updatedAt = new Date().toISOString();
    
    table.set(key, item);
    this.saveData();
    return item;
  }
}

const mockDB = new MockDynamoDB();

// Add helper methods for mock database compatibility
mockDB.simpleUpdate = function(tableName, key, updates) {
  return this.updateItem(tableName, key, updates);
};

mockDB.atomicIncrement = function(tableName, key, attribute, increment = 1) {
  const item = this.getItem(tableName, key);
  if (item) {
    item[attribute] = (item[attribute] || 0) + increment;
    return this.updateItem(tableName, key, item);
  }
  return null;
};

mockDB.conditionalPut = function(tableName, item, keyAttribute = 'userId') {
  const existingItem = this.getItem(tableName, { [keyAttribute]: item[keyAttribute] });
  if (!existingItem) {
    this.putItem(tableName, item);
    return true;
  }
  return false;
};

mockDB.batchWriteItems = function(tableName, items) {
  items.forEach(item => this.putItem(tableName, item));
  return { success: true };
};

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