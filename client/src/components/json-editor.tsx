import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, Download } from "lucide-react";
import { formatJson, copyToClipboard, downloadJson } from "@/lib/json-utils";
import { useToast } from "@/hooks/use-toast";
import type { JsonTestStructure } from "@shared/schema";
import Editor from "@monaco-editor/react";

interface JsonEditorProps {
  data: JsonTestStructure;
  onDataChange?: (data: JsonTestStructure) => void;
  className?: string;
}

export function JsonEditor({ data, onDataChange, className }: JsonEditorProps) {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setJsonString(formatJson(data));
  }, [data]);

  const handleJsonChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    setJsonString(value);
    try {
      const parsed = JSON.parse(value);
      setError(null);
      if (onDataChange) {
        onDataChange(parsed);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = formatJson(parsed);
      setJsonString(formatted);
      setError(null);
      toast({
        title: "JSON Formatted",
        description: "JSON has been formatted successfully",
      });
    } catch (err) {
      setError((err as Error).message);
      toast({
        title: "Format Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(jsonString);
      toast({
        title: "Copied",
        description: "JSON copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const testCaseId = parsed.tests?.[0]?.test_case_id || "test";
      downloadJson(parsed, `${testCaseId}.json`);
      toast({
        title: "Downloaded",
        description: "JSON file downloaded successfully",
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">JSON Preview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormat}
              title="Format JSON"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download JSON"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative">
        <div className="h-full relative">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={jsonString}
            onChange={handleJsonChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              fontSize: 14,
              automaticLayout: true,
              folding: true,
              lineNumbers: "on",
              renderWhitespace: "selection",
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: "line",
              formatOnPaste: true,
              formatOnType: true,
              bracketPairColorization: {
                enabled: true
              },
              colorDecorators: true
            }}
          />
          {error && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium z-10 shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-100">⚠</span>
                <span>Invalid JSON: {error}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
