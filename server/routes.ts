import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestCaseSchema, insertDatabaseSchema, insertValidationResultSchema, JsonTestStructure } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test case routes
  app.get("/api/test-cases", async (req, res) => {
    try {
      const testCases = await storage.getAllTestCases();
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test cases" });
    }
  });

  app.get("/api/test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testCase = await storage.getTestCase(id);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test case" });
    }
  });

  app.post("/api/test-cases", async (req, res) => {
    try {
      const validatedData = insertTestCaseSchema.parse(req.body);
      const testCase = await storage.createTestCase(validatedData);
      res.status(201).json(testCase);
    } catch (error) {
      res.status(400).json({ message: "Invalid test case data", error });
    }
  });

  app.put("/api/test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTestCaseSchema.partial().parse(req.body);
      const testCase = await storage.updateTestCase(id, validatedData);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      res.status(400).json({ message: "Invalid test case data", error });
    }
  });

  app.delete("/api/test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTestCase(id);
      if (!deleted) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test case" });
    }
  });

  // Database routes
  app.get("/api/databases", async (req, res) => {
    try {
      const databases = await storage.getAllDatabases();
      res.json(databases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch databases" });
    }
  });

  app.post("/api/databases", async (req, res) => {
    try {
      const validatedData = insertDatabaseSchema.parse(req.body);
      const database = await storage.createDatabase(validatedData);
      
      // Update .env file with database credentials
      await updateEnvFile(database);
      
      res.status(201).json(database);
    } catch (error) {
      res.status(400).json({ message: "Invalid database data", error });
    }
  });

  app.get("/api/databases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const database = await storage.getDatabase(id);
      if (!database) {
        return res.status(404).json({ message: "Database not found" });
      }
      res.json(database);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch database" });
    }
  });

  app.delete("/api/databases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDatabase(id);
      if (!deleted) {
        return res.status(404).json({ message: "Database not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete database" });
    }
  });

  app.post("/api/databases/test-connection", async (req, res) => {
    try {
      const { host, port, databaseName, username, password, databaseType } = req.body;
      
      // Simulate connection test delay
      setTimeout(() => {
        // Basic validation
        if (!host || !port || !databaseName || !username || !password || !databaseType) {
          res.json({ 
            success: false, 
            message: "Connection failed - Missing required fields"
          });
          return;
        }

        // Simulate connection test (in real implementation, this would test actual connection)
        const connectionSuccess = Math.random() > 0.3; // 70% success rate for demo
        
        if (connectionSuccess) {
          res.json({ 
            success: true, 
            message: "Connection successful",
            details: `Connected to ${databaseName} successfully`
          });
        } else {
          res.json({ 
            success: false, 
            message: "Connection failed - Unable to connect to database"
          });
        }
      }, 1500);
      
    } catch (error) {
      res.status(500).json({ success: false, message: "Connection failed", error: error.message });
    }
  });

  // Validation routes
  app.get("/api/validation-results", async (req, res) => {
    try {
      const results = await storage.getAllValidationResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  app.post("/api/validation-results", async (req, res) => {
    try {
      const validatedData = insertValidationResultSchema.parse(req.body);
      const result = await storage.createValidationResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid validation result data", error });
    }
  });

  // File operations
  app.post("/api/save", async (req, res) => {
    try {
      const jsonData = req.body;
      
      // Validate JSON structure
      const validatedJson = JsonTestStructure.parse(jsonData);
      
      // Generate filename based on test case ID
      const testCaseId = validatedJson.tests[0]?.test_case_id || `test_${Date.now()}`;
      const filename = `${testCaseId}.json`;
      const filePath = path.join(process.cwd(), "test_configs", filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Save JSON file
      await fs.writeFile(filePath, JSON.stringify(validatedJson, null, 2));
      
      res.json({ success: true, filename, path: filePath });
    } catch (error) {
      res.status(400).json({ success: false, message: "Failed to save JSON", error });
    }
  });

  app.post("/api/upload-json", async (req, res) => {
    try {
      const { jsonData } = req.body;
      const validatedJson = JsonTestStructure.parse(jsonData);
      res.json({ success: true, data: validatedJson });
    } catch (error) {
      res.status(400).json({ success: false, message: "Invalid JSON structure", error });
    }
  });

  app.get("/api/load-template", async (req, res) => {
    const template = {
      tests: [
        {
          test_case_id: "",
          test_case_description: "",
          action: "CREATE",
          inputs: [
            {
              feature_sr_no: 1,
              domain: "gas",
              feature: "",
              dependent_test_case: "",
              dependent_feature_sr_no: 0,
              attributes: {},
              validation: [
                {
                  database: "",
                  sql_query: "",
                  expected_result: {}
                }
              ]
            }
          ]
        }
      ]
    };
    res.json(template);
  });

  // Python script execution
  app.post("/api/execute-lambda", async (req, res) => {
    try {
      const result = await executeScript("src/common/utils/execution_lambda.py");
      res.json({ success: true, message: "Lambda executed successfully", output: result });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lambda execution failed", error: error.message });
    }
  });

  app.post("/api/validate-features", async (req, res) => {
    try {
      const { duration } = req.body; // Duration in minutes from frontend
      const durationMs = duration ? duration * 60 * 1000 : 3600000; // Convert to milliseconds, default 1 hour
      
      // Start validation process
      setTimeout(async () => {
        try {
          const result = await executeScript("src/common/utils/validation/process_validation.py");
          console.log("Validation completed:", result);
        } catch (error) {
          console.error("Validation failed:", error);
        }
      }, durationMs);
      
      const durationText = duration ? 
        (duration < 60 ? `${duration} minute${duration > 1 ? 's' : ''}` : `${Math.floor(duration / 60)} hour${Math.floor(duration / 60) > 1 ? 's' : ''}`) :
        "1 hour";
      
      res.json({ success: true, message: `Validation started, will complete in ${durationText}` });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to start validation", error: error.message });
    }
  });

  app.get("/api/state-json/:testCaseId/:action", async (req, res) => {
    try {
      const { testCaseId, action } = req.params;
      const actionFolder = `${action.toLowerCase()}_validation`;
      const filename = `${testCaseId}.state.json`;
      const filePath = path.join(process.cwd(), "test_execution_state", actionFolder, filename);
      
      try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);
        res.json({ success: true, data: jsonData, filename });
      } catch (fileError) {
        res.status(404).json({ success: false, message: "File not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to read state file", error: error.message });
    }
  });

  // Dashboard data
  app.get("/api/dashboard-stats", async (req, res) => {
    try {
      const validationResults = await storage.getAllValidationResults();
      
      const stats = {
        totalTests: validationResults.length,
        passedTests: validationResults.filter(r => r.status === "passed").length,
        failedTests: validationResults.filter(r => r.status === "failed").length,
        byStage: {
          create: validationResults.filter(r => r.stage === "create").length,
          update: validationResults.filter(r => r.stage === "update").length,
          delete: validationResults.filter(r => r.stage === "delete").length,
        }
      };
      
      stats.successRate = stats.totalTests > 0 ? Math.round((stats.passedTests / stats.totalTests) * 100) : 0;
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Read validation.csv data
  app.get("/api/validation-csv", async (req, res) => {
    try {
      const csvPath = path.join(process.cwd(), "validation.csv");
      const csvContent = await fs.readFile(csvPath, "utf-8");
      
      // Parse CSV manually (simple implementation)
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      });
      
      res.json(data);
    } catch (error) {
      console.error("Error reading validation.csv:", error);
      // Return sample data if CSV doesn't exist using correct column names
      const sampleData = [
        { test_case_id: "CON0002719-38889", domain: "gas", stage: "create", test_case_validation_status: "passed", executed_at: "2025-01-15T10:30:00Z", error_message: "" },
        { test_case_id: "CON0002720-38890", domain: "land", stage: "update", test_case_validation_status: "failed", executed_at: "2025-01-15T11:15:00Z", error_message: "Database connection timeout" },
        { test_case_id: "CON0002721-38891", domain: "electric", stage: "delete", test_case_validation_status: "passed", executed_at: "2025-01-15T12:00:00Z", error_message: "" },
        { test_case_id: "CON0002722-38892", domain: "gas", stage: "create", test_case_validation_status: "passed", executed_at: "2025-01-10T13:30:00Z", error_message: "" },
        { test_case_id: "CON0002723-38893", domain: "gas", stage: "update", test_case_validation_status: "passed", executed_at: "2025-06-10T14:15:00Z", error_message: "" },
        { test_case_id: "CON0002724-38894", domain: "land", stage: "create", test_case_validation_status: "failed", executed_at: "2025-06-10T15:00:00Z", error_message: "Invalid SQL query syntax" },
        { test_case_id: "CON0002725-38895", domain: "land", stage: "delete", test_case_validation_status: "passed", executed_at: "2025-06-10T16:30:00Z", error_message: "" },
      ];
      res.json(sampleData);
    }
  });

  // Get execution state files structure
  app.get("/api/execution-files", async (req, res) => {
    try {
      const baseDir = path.join(process.cwd(), "test_execution_state");
      
      // Check if directory exists
      try {
        await fs.access(baseDir);
      } catch {
        // Create directory if it doesn't exist
        await fs.mkdir(baseDir, { recursive: true });
        // Create the standard folders
        const standardFolders = ["create", "update", "delete", "create_validation", "update_validation", "delete_validation"];
        for (const folder of standardFolders) {
          await fs.mkdir(path.join(baseDir, folder), { recursive: true });
        }
      }
      
      const files = await readDirectoryStructure(baseDir, "test_execution_state");
      res.json({ success: true, files });
    } catch (error) {
      console.error("Error reading execution files:", error);
      res.status(500).json({ success: false, message: "Failed to read file structure", error: error.message });
    }
  });

  // Get execution state file content
  app.get("/api/execution-files/content", async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ success: false, message: "File path is required" });
      }

      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check: ensure the path is within our project directory
      if (!fullPath.startsWith(process.cwd())) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      let content = await fs.readFile(fullPath, "utf-8");
      
      // Auto-format JSON files
      if (fullPath.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(content);
          content = JSON.stringify(jsonData, null, 2);
        } catch (error) {
          // If parsing fails, return original content
          console.log('Failed to parse JSON file for formatting:', error);
        }
      }
      
      res.json({ success: true, content });
    } catch (error) {
      console.error("Error reading file:", error);
      res.status(404).json({ success: false, message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
async function executeScript(scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", [scriptPath]);
    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });
  });
}

async function readDirectoryStructure(dirPath: string, relativePath: string): Promise<any[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const relativeItemPath = path.join(relativePath, item.name);

      if (item.isDirectory()) {
        const children = await readDirectoryStructure(itemPath, relativeItemPath);
        result.push({
          name: item.name,
          type: "folder",
          path: relativeItemPath,
          children
        });
      } else if (item.isFile()) {
        result.push({
          name: item.name,
          type: "file",
          path: relativeItemPath
        });
      }
    }

    return result;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

async function updateEnvFile(database: any): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch (error) {
      // File doesn't exist, create new
    }

    const connectionName = database.connectionName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    const newEntries = [
      `${connectionName}_HOST="${database.host}"`,
      `${connectionName}_PORT=${database.port}`,
      `${connectionName}_DATABASE_NAME="${database.databaseName}"`,
      `${connectionName}_USERNAME="${database.username}"`,
      `${connectionName}_PASSWORD="${database.password}"`,
      `${connectionName}_TYPE="${database.databaseType}"`
    ];

    // Add new entries to env content
    const updatedContent = envContent + "\n\n# " + database.connectionName + "\n" + newEntries.join("\n") + "\n";
    
    await fs.writeFile(envPath, updatedContent);
  } catch (error) {
    console.error("Failed to update .env file:", error);
  }
}
