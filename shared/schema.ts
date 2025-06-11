import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  testCaseId: text("test_case_id").notNull().unique(),
  testCaseDescription: text("test_case_description").notNull(),
  action: text("action").notNull(),
  jsonData: jsonb("json_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const databases = pgTable("databases", {
  id: serial("id").primaryKey(),
  connectionName: text("connection_name").notNull().unique(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  databaseName: text("database_name").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  databaseType: text("database_type").notNull(), // postgres, mysql, oracle
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const validationResults = pgTable("validation_results", {
  id: serial("id").primaryKey(),
  testCaseId: text("test_case_id").notNull(),
  stage: text("stage").notNull(), // create, update, delete
  status: text("status").notNull(), // passed, failed
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Insert schemas
export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDatabaseSchema = createInsertSchema(databases).omit({
  id: true,
  createdAt: true,
});

export const insertValidationResultSchema = createInsertSchema(validationResults).omit({
  id: true,
  executedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type TestCase = typeof testCases.$inferSelect;
export type InsertDatabase = z.infer<typeof insertDatabaseSchema>;
export type Database = typeof databases.$inferSelect;
export type InsertValidationResult = z.infer<typeof insertValidationResultSchema>;
export type ValidationResult = typeof validationResults.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// JSON Structure Types
export const JsonTestStructure = z.object({
  tests: z.array(z.object({
    test_case_id: z.string(),
    test_case_description: z.string(),
    action: z.enum(["CREATE", "UPDATE", "DELETE"]),
    test_case_type: z.enum(["land", "gas", "electric"]).optional(),
    inputs: z.array(z.object({
      feature_sr_no: z.number(),
      domain: z.enum(["land", "gas", "electric", ""]),
      feature: z.string(),
      dependent_test_case: z.string(),
      dependent_feature_sr_no: z.number().default(0),
      attributes: z.record(z.string()),
      validation: z.array(z.object({
        database: z.string(),
        sql_query: z.string(),
        expected_result: z.record(z.string()),
      })),
    })),
  })),
});

export type JsonTestStructure = z.infer<typeof JsonTestStructure>;
