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
        this.tables = new Map(Object.entries(data));
      }
    } catch (error) {
      console.log('Starting with empty mock database');
    }
  }

  saveData() {
    try {
      const data = Object.fromEntries(this.tables);
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
    const key = item.id || item.userId || item.email || Date.now().toString();
    table.set(key, item);
    this.saveData();
    return { success: true };
  }

  getItem(tableName, key) {
    const table = this.tables.get(tableName);
    if (!table) return null;
    return table.get(key) || null;
  }

  scan(tableName, limit = 100) {
    const table = this.tables.get(tableName);
    if (!table) return [];
    const items = Array.from(table.values()).slice(0, limit);
    return items;
  }

  query(tableName, keyCondition, limit = 100) {
    const table = this.tables.get(tableName);
    if (!table) return [];
    
    // Simple query implementation
    const items = Array.from(table.values());
    return items.slice(0, limit);
  }

  deleteItem(tableName, key) {
    const table = this.tables.get(tableName);
    if (table) {
      table.delete(key);
      this.saveData();
    }
    return { success: true };
  }

  updateItem(tableName, key, updates) {
    const table = this.tables.get(tableName);
    if (table && table.has(key)) {
      const item = table.get(key);
      Object.assign(item, updates);
      table.set(key, item);
      this.saveData();
      return item;
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

module.exports = mockDB;