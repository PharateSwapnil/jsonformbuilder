import { useState } from "react";
import { Header } from "@/components/header";
import { ActionSidebar } from "@/components/action-sidebar";
import { FormBuilder } from "@/components/form-builder";
import { JsonEditor } from "@/components/json-editor";
import { Dashboard } from "./dashboard";
import { FileBrowser } from "@/components/file-browser";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { copyToClipboard, formatJson } from "@/lib/json-utils";
import type { FormData } from "@/hooks/use-json-form";
import type { JsonTestStructure, Database } from "@shared/schema";
import Editor from "@monaco-editor/react";
import { Database as DatabaseIcon } from "lucide-react";

const initialFormData: FormData = {
  test_case_id: "",
  test_case_description: "",
  action: "",
  test_case_type: "",
  inputs: [
    {
      feature_sr_no: 1,
      domain: "",
      feature: "",
      dependent_test_case: "",
      dependent_feature_sr_no: 0,
      attributes: {},
      validation: [
        {
          database: "",
          sql_query: "",
          expected_result: {},
        },
      ],
    },
  ],
};

export default function JsonBuilder() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAddDatabase, setShowAddDatabase] = useState(false);
  const [showSavedDatabases, setShowSavedDatabases] = useState(false);
  const [showStateJson, setShowStateJson] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [stateJsonData, setStateJsonData] = useState<any>(null);
  const [savedDatabases, setSavedDatabases] = useState<any[]>([]);
  const { toast } = useToast();

  const [newDatabase, setNewDatabase] = useState({
    connectionName: "",
    host: "",
    port: 5432,
    databaseName: "",
    username: "",
    password: "",
    databaseType: "postgres",
  });

  const getJsonOutput = (): JsonTestStructure => {
    return {
      tests: [
        {
          test_case_id: formData.test_case_id,
          test_case_description: formData.test_case_description,
          action: formData.action as "CREATE" | "UPDATE" | "DELETE",
          test_case_type: formData.test_case_type as "land" | "gas" | "electric",
          inputs: formData.inputs.filter(input => input.domain !== "").map(input => ({
            ...input,
            domain: input.domain as "land" | "gas" | "electric",
            dependent_test_case: input.dependent_test_case || "",
          })),
        },
      ],
    };
  };

  const handleNewForm = () => {
    const newWindow = window.open(window.location.href, "_blank");
    if (!newWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to open new forms",
        variant: "destructive",
      });
    }
  };

  const handleLoadTemplate = async () => {
    try {
      const response = await apiRequest("GET", "/api/load-template");
      const template = await response.json();
      setFormData({
        test_case_id: template.tests[0].test_case_id,
        test_case_description: template.tests[0].test_case_description,
        action: template.tests[0].action,
        test_case_type: template.tests[0].test_case_type || "",
        inputs: template.tests[0].inputs,
      });
      toast({
        title: "Template Loaded",
        description: "Template has been loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load template",
        variant: "destructive",
      });
    }
  };

  const handleUploadJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            if (jsonData.tests && jsonData.tests.length > 0) {
              const test = jsonData.tests[0];
              setFormData({
                test_case_id: test.test_case_id,
                test_case_description: test.test_case_description,
                action: test.action,
                test_case_type: test.test_case_type || "",
                inputs: test.inputs,
              });
              toast({
                title: "JSON Uploaded",
                description: "JSON file has been loaded successfully",
              });
            }
          } catch (error) {
            toast({
              title: "Upload Failed",
              description: "Invalid JSON format",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSaveJson = async () => {
    try {
      const jsonOutput = getJsonOutput();
      const response = await apiRequest("POST", "/api/save", jsonOutput);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "JSON Saved",
          description: `JSON saved successfully as ${result.filename}`,
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save JSON file",
        variant: "destructive",
      });
    }
  };

  const handleStateJson = async () => {
    const startTime = Date.now();
    let processingToast: any = null;
    let timerInterval: NodeJS.Timeout | null = null;
    let elapsedSeconds = 0;

    try {
      // Show initial processing toast
      processingToast = toast({
        title: "File Processing",
        description: "Please wait... file is processing 0 sec",
        duration: Infinity, // Keep it open until we dismiss it
      });

      // Update toast every second with elapsed time
      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const timeDisplay = elapsedSeconds < 60 
          ? `${elapsedSeconds} sec` 
          : `${Math.floor(elapsedSeconds / 60)} min ${elapsedSeconds % 60} sec`;

        if (processingToast) {
          processingToast.update({
            title: "File Processing",
            description: `Please wait... file is processing ${timeDisplay}`,
          });
        }
      }, 1000);

      // Execute lambda
      const lambdaResponse = await apiRequest("POST", "/api/execute-lambda");
      const lambdaResult = await lambdaResponse.json();

      // Calculate actual execution time
      const endTime = Date.now();
      const actualDuration = Math.round((endTime - startTime) / 1000);
      const durationDisplay = actualDuration < 60 
        ? `${actualDuration} sec` 
        : `${Math.floor(actualDuration / 60)} min ${actualDuration % 60} sec`;

      // Clear timer and dismiss processing toast
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (processingToast) {
        processingToast.dismiss();
        processingToast = null;
      }

      if (lambdaResult.success) {
        // Show success message with execution time
        toast({
          title: "File Processed Successfully",
          description: `File processed successfully in ${durationDisplay}`,
          variant: "default",
        });

        // Ask if user wants to see state JSON
        const wantToSeeState = window.confirm(
          `Script executed successfully in ${durationDisplay}! Do you want to see the state JSON?`
        );

        if (wantToSeeState) {
          const testCaseId = formData.test_case_id;
          const action = formData.action;

          if (testCaseId && action) {
            try {
              const response = await apiRequest("GET", `/api/state-json/${testCaseId}/${action}`);
              const result = await response.json();

              if (result.success) {
                setStateJsonData(result.data);
                setShowStateJson(true);
              } else {
                toast({
                  title: "File Not Found",
                  description: result.message || "State JSON file not found for this test case and action",
                  variant: "destructive",
                });
              }
            } catch (stateError) {
              toast({
                title: "File Not Found",
                description: "State JSON file not found for this test case and action",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Missing Information",
              description: "Please provide test case ID and action",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "File Failed to Execute",
          description: `File failed to execute after ${durationDisplay}. Error: ${lambdaResult.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Calculate execution time even on error
      const endTime = Date.now();
      const actualDuration = Math.round((endTime - startTime) / 1000);
      const durationDisplay = actualDuration < 60 
        ? `${actualDuration} sec` 
        : `${Math.floor(actualDuration / 60)} min ${actualDuration % 60} sec`;

      // Clear timer and dismiss processing toast
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      if (processingToast) {
        processingToast.dismiss();
      }

      toast({
        title: "File Failed to Execute",
        description: `File failed to execute after ${durationDisplay}. Error: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleValidateFeatures = () => {
    // Validation is handled in ActionSidebar
  };

  const handleExecutionState = () => {
    setShowFileBrowser(true);
  };

  const handleFormatJson = () => {
    try {
      const jsonOutput = getJsonOutput();
      const formatted = formatJson(jsonOutput);
      toast({
        title: "JSON Formatted",
        description: "JSON has been formatted successfully",
      });
    } catch (error) {
      toast({
        title: "Format Failed",
        description: "Failed to format JSON",
        variant: "destructive",
      });
    }
  };

  const handleCopyJson = async () => {
    try {
      const jsonOutput = getJsonOutput();
      const jsonString = formatJson(jsonOutput);
      await copyToClipboard(jsonString);
      toast({
        title: "Copied",
        description: "JSON copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await apiRequest("POST", "/api/databases/test-connection", newDatabase);

      if (response.success) {
        toast({
          title: "Connection Successful",
          description: response.message || "Database connection test passed",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: response.message || "Database connection test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test database connection",
        variant: "destructive",
      });
    }
  };

  const handleAddDatabase = async () => {
    try {
      await apiRequest("POST", "/api/databases", newDatabase);
      toast({
        title: "Database Added",
        description: "Database connection has been added successfully",
      });
      setShowAddDatabase(false);
      setNewDatabase({
        connectionName: "",
        host: "",
        port: 5432,
        databaseName: "",
        username: "",
        password: "",
        databaseType: "postgres",
      });
      // Refresh saved databases list
      loadSavedDatabases();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add database connection",
        variant: "destructive",
      });
    }
  };

  const loadSavedDatabases = async () => {
    try {
      const response = await apiRequest("GET", "/api/databases");
      const data = await response.json();
      setSavedDatabases(data);
    } catch (error) {
      console.error("Failed to load saved databases:", error);
    }
  };

  const handleDeleteDatabase = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/databases/${id}`);
      toast({
        title: "Database Deleted",
        description: "Database connection has been removed successfully",
      });
      loadSavedDatabases();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete database connection",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onDashboardToggle={() => setShowDashboard(true)} />

      <div className="flex-1 flex">
        <ActionSidebar
          onNewForm={handleNewForm}
          onLoadTemplate={handleLoadTemplate}
          onUploadJson={handleUploadJson}
          onSaveJson={handleSaveJson}
          onStateJson={handleStateJson}
          onValidateFeatures={handleValidateFeatures}
          onExecutionState={handleExecutionState}
          onFormatJson={handleFormatJson}
          onCopyJson={handleCopyJson}
          onAddDatabase={() => setShowAddDatabase(true)}
          onSavedDatabases={() => {
            loadSavedDatabases();
            setShowSavedDatabases(true);
          }}
        />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full overflow-y-auto p-6">
              <FormBuilder data={formData} onChange={setFormData} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full p-4">
              <JsonEditor
                data={getJsonOutput()}
                className="h-full"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dashboard Modal */}
      <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden">
          <div className="h-[85vh] overflow-y-auto">
            <Dashboard />
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Databases Modal */}
      <Dialog open={showSavedDatabases} onOpenChange={setShowSavedDatabases}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Saved Database Connections</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {savedDatabases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DatabaseIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No saved database connections found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedDatabases.map((db) => (
                  <div key={db.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{db.connectionName}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDatabase(db.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Host:</span> {db.host}
                      </div>
                      <div>
                        <span className="font-medium">Port:</span> {db.port}
                      </div>
                      <div>
                        <span className="font-medium">Database:</span> {db.databaseName}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {db.databaseType}
                      </div>
                      <div>
                        <span className="font-medium">Username:</span> {db.username}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(db.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Database Modal */}
      <Dialog open={showAddDatabase} onOpenChange={setShowAddDatabase}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Database Connection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="connectionName">Connection Name</Label>
              <Input
                id="connectionName"
                value={newDatabase.connectionName}
                onChange={(e) => setNewDatabase({ ...newDatabase, connectionName: e.target.value })}
                placeholder="e.g., Production GSDS"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={newDatabase.host}
                  onChange={(e) => setNewDatabase({ ...newDatabase, host: e.target.value })}
                  placeholder="Enter database host"
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={newDatabase.port}
                  onChange={(e) => setNewDatabase({ ...newDatabase, port: parseInt(e.target.value) || 5432 })}
                  placeholder="5432"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="databaseName">Database Name</Label>
              <Input
                id="databaseName"
                value={newDatabase.databaseName}
                onChange={(e) => setNewDatabase({ ...newDatabase, databaseName: e.target.value })}
                placeholder="Enter database name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newDatabase.username}
                  onChange={(e) => setNewDatabase({ ...newDatabase, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newDatabase.password}
                  onChange={(e) => setNewDatabase({ ...newDatabase, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="databaseType">Database Type</Label>
              <Select 
                value={newDatabase.databaseType} 
                onValueChange={(value) => setNewDatabase({ ...newDatabase, databaseType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={handleTestConnection}>
                Test Connection
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowAddDatabase(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDatabase}>
                  Add Database
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* State JSON Preview Modal */}
      <Dialog open={showStateJson} onOpenChange={setShowStateJson}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>State JSON Preview</DialogTitle>
          </DialogHeader>

          {stateJsonData && (
            <div className="h-[75vh] w-full border rounded-lg overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={formatJson(stateJsonData)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbers: "on",
                  folding: true,
                  bracketPairColorization: {
                    enabled: true
                  }
                }}
                onMount={(editor, monaco) => {
                  // Define custom JSON theme with proper syntax highlighting
                  monaco.editor.defineTheme('json-state-custom', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'key', foreground: '3b82f6', fontStyle: 'bold' }, // Blue for keys
                      { token: 'string', foreground: '10b981' }, // Green for strings
                      { token: 'number', foreground: 'f59e0b' }, // Orange for numbers
                      { token: 'keyword', foreground: 'ef4444' }, // Red for booleans/null
                      { token: 'delimiter', foreground: '6b7280' }, // Gray for brackets
                    ],
                    colors: {
                      'editor.background': '#111827',
                      'editor.foreground': '#f3f4f6'
                    }
                  });
                  monaco.editor.setTheme('json-state-custom');

                  // Format JSON content
                  try {
                    const formatted = JSON.stringify(JSON.parse(formatJson(stateJsonData)), null, 2);
                    editor.setValue(formatted);
                  } catch (e) {
                    // Keep original content if JSON is invalid
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Browser Modal */}
      <FileBrowser open={showFileBrowser} onOpenChange={setShowFileBrowser} />
    </div>
  );
}