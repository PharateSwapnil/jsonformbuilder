import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  FileText,
  Upload,
  Save,
  PlayCircle,
  CheckCircle,
  Activity,
  Code,
  Copy,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ActionSidebarProps {
  onNewForm: () => void;
  onLoadTemplate: () => void;
  onUploadJson: () => void;
  onSaveJson: () => void;
  onStateJson: () => void;
  onValidateFeatures: () => void;
  onExecutionState: () => void;
  onFormatJson: () => void;
  onCopyJson: () => void;
  onAddDatabase: () => void;
}

export function ActionSidebar({
  onNewForm,
  onLoadTemplate,
  onUploadJson,
  onSaveJson,
  onStateJson,
  onValidateFeatures,
  onExecutionState,
  onFormatJson,
  onCopyJson,
  onAddDatabase,
}: ActionSidebarProps) {
  const { toast } = useToast();

  const handleValidateFeatures = async () => {
    try {
      // Trigger validation timer
      window.dispatchEvent(new Event('startValidation'));
      
      // Call API to start validation
      await apiRequest("POST", "/api/validate-features");
      
      toast({
        title: "Validation Started",
        description: "Feature validation process has been initiated. Please wait 1 minute for completion.",
      });
      
      onValidateFeatures();
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Failed to start validation process",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-64 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6 overflow-y-auto">
        {/* Primary Actions */}
        <div className="space-y-2">
          <Button 
            onClick={onNewForm}
            className="w-full justify-start space-x-3 h-12"
            title="Create a new test case form in a separate window"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">New Form</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={onLoadTemplate}
            className="w-full justify-start space-x-3 h-12"
            title="Load predefined JSON template structure"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Load Template</span>
          </Button>
        </div>

        <Separator />

        {/* File Operations */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">File Operations</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={onUploadJson}
              className="w-full justify-start space-x-3"
              title="Upload existing JSON file to populate form"
            >
              <Upload className="w-4 h-4" />
              <span>Upload JSON</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={onSaveJson}
              className="w-full justify-start space-x-3"
              title="Save current JSON to test_config folder"
            >
              <Save className="w-4 h-4" />
              <span>Save JSON</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={onStateJson}
              className="w-full justify-start space-x-3"
              title="Execute lambda function and preview state JSON"
            >
              <PlayCircle className="w-4 h-4" />
              <span>State JSON</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Validation & Testing */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Validation</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={handleValidateFeatures}
              className="w-full justify-start space-x-3 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Start 1-minute validation process with timer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Validate Features</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={onExecutionState}
              className="w-full justify-start space-x-3"
              title="View test execution status and results"
            >
              <Activity className="w-4 h-4" />
              <span>Execution State</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* JSON Operations */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">JSON Tools</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={onFormatJson}
              className="w-full justify-start space-x-3"
              title="Format and beautify JSON structure"
            >
              <Code className="w-4 h-4" />
              <span>Format JSON</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={onCopyJson}
              className="w-full justify-start space-x-3"
              title="Copy JSON to clipboard"
            >
              <Copy className="w-4 h-4" />
              <span>Copy JSON</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Database Management */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Database</h3>
          <Button
            variant="ghost"
            onClick={onAddDatabase}
            className="w-full justify-start space-x-3 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Add new database connection with credentials"
          >
            <Database className="w-4 h-4" />
            <span>Add Database</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
