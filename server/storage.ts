import { 
  users, testCases, databases, validationResults,
  type User, type InsertUser, 
  type TestCase, type InsertTestCase,
  type Database, type InsertDatabase,
  type ValidationResult, type InsertValidationResult
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Test case operations
  getTestCase(id: number): Promise<TestCase | undefined>;
  getTestCaseByTestId(testCaseId: string): Promise<TestCase | undefined>;
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<boolean>;
  getAllTestCases(): Promise<TestCase[]>;
  
  // Database operations
  getDatabase(id: number): Promise<Database | undefined>;
  getDatabaseByConnectionName(connectionName: string): Promise<Database | undefined>;
  createDatabase(database: InsertDatabase): Promise<Database>;
  updateDatabase(id: number, database: Partial<InsertDatabase>): Promise<Database | undefined>;
  deleteDatabase(id: number): Promise<boolean>;
  getAllDatabases(): Promise<Database[]>;
  
  // Validation result operations
  getValidationResult(id: number): Promise<ValidationResult | undefined>;
  createValidationResult(result: InsertValidationResult): Promise<ValidationResult>;
  getValidationResultsByTestCase(testCaseId: string): Promise<ValidationResult[]>;
  getAllValidationResults(): Promise<ValidationResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private testCases: Map<number, TestCase>;
  private databases: Map<number, Database>;
  private validationResults: Map<number, ValidationResult>;
  private currentUserId: number;
  private currentTestCaseId: number;
  private currentDatabaseId: number;
  private currentValidationId: number;

  constructor() {
    this.users = new Map();
    this.testCases = new Map();
    this.databases = new Map();
    this.validationResults = new Map();
    this.currentUserId = 1;
    this.currentTestCaseId = 1;
    this.currentDatabaseId = 1;
    this.currentValidationId = 1;
    
    // Initialize with some default databases
    this.initializeDefaultDatabases();
  }

  private initializeDefaultDatabases() {
    const defaultDbs = [
      {
        connectionName: "Test_&_Raw/GSDS",
        host: "localhost",
        port: 5432,
        databaseName: "gsds_test",
        username: "admin",
        password: "password",
        databaseType: "postgres"
      },
      {
        connectionName: "Production/GSDS",
        host: "prod-server",
        port: 5432,
        databaseName: "gsds_prod",
        username: "admin",
        password: "password",
        databaseType: "postgres"
      }
    ];

    defaultDbs.forEach(db => {
      const id = this.currentDatabaseId++;
      const database: Database = {
        ...db,
        id,
        createdAt: new Date()
      };
      this.databases.set(id, database);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Test case operations
  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async getTestCaseByTestId(testCaseId: string): Promise<TestCase | undefined> {
    return Array.from(this.testCases.values()).find(tc => tc.testCaseId === testCaseId);
  }

  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const id = this.currentTestCaseId++;
    const now = new Date();
    const testCase: TestCase = {
      ...insertTestCase,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.testCases.set(id, testCase);
    return testCase;
  }

  async updateTestCase(id: number, updates: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.testCases.get(id);
    if (!existing) return undefined;

    const updated: TestCase = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.testCases.delete(id);
  }

  async getAllTestCases(): Promise<TestCase[]> {
    return Array.from(this.testCases.values());
  }

  // Database operations
  async getDatabase(id: number): Promise<Database | undefined> {
    return this.databases.get(id);
  }

  async getDatabaseByConnectionName(connectionName: string): Promise<Database | undefined> {
    return Array.from(this.databases.values()).find(db => db.connectionName === connectionName);
  }

  async createDatabase(insertDatabase: InsertDatabase): Promise<Database> {
    const id = this.currentDatabaseId++;
    const database: Database = {
      ...insertDatabase,
      id,
      createdAt: new Date()
    };
    this.databases.set(id, database);
    return database;
  }

  async updateDatabase(id: number, updates: Partial<InsertDatabase>): Promise<Database | undefined> {
    const existing = this.databases.get(id);
    if (!existing) return undefined;

    const updated: Database = {
      ...existing,
      ...updates
    };
    this.databases.set(id, updated);
    return updated;
  }

  async deleteDatabase(id: number): Promise<boolean> {
    return this.databases.delete(id);
  }

  async getAllDatabases(): Promise<Database[]> {
    return Array.from(this.databases.values());
  }

  // Validation result operations
  async getValidationResult(id: number): Promise<ValidationResult | undefined> {
    return this.validationResults.get(id);
  }

  async createValidationResult(insertResult: InsertValidationResult): Promise<ValidationResult> {
    const id = this.currentValidationId++;
    const result: ValidationResult = {
      ...insertResult,
      id,
      executedAt: new Date()
    };
    this.validationResults.set(id, result);
    return result;
  }

  async getValidationResultsByTestCase(testCaseId: string): Promise<ValidationResult[]> {
    return Array.from(this.validationResults.values()).filter(vr => vr.testCaseId === testCaseId);
  }

  async getAllValidationResults(): Promise<ValidationResult[]> {
    return Array.from(this.validationResults.values());
  }
}

export const storage = new MemStorage();
