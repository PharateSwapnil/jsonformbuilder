
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Folder, File, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Editor from "@monaco-editor/react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
}

interface FileBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileBrowser({ open, onOpenChange }: FileBrowserProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["test_execution_state"]));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/execution-files");
      const data = await response.json();
      
      if (data.success && data.files) {
        setFiles(data.files);
        // Auto-expand all folders for better visibility
        const allFolderPaths = collectFolderPaths(data.files);
        setExpandedFolders(new Set(allFolderPaths));
      } else {
        console.error("Failed to load files:", data);
        toast({
          title: "Error",
          description: data.message || "Failed to load execution files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load execution files:", error);
      toast({
        title: "Error",
        description: "Failed to load execution files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const collectFolderPaths = (nodes: FileNode[]): string[] => {
    const paths: string[] = [];
    const traverse = (nodeList: FileNode[]) => {
      nodeList.forEach(node => {
        if (node.type === "folder") {
          paths.push(node.path);
          if (node.children) {
            traverse(node.children);
          }
        }
      });
    };
    traverse(nodes);
    return paths;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "File structure updated",
    });
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const previewFile = async (filePath: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/execution-files/content?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      
      if (data.success) {
        setFileContent(data.content);
        setSelectedFile(filePath);
        setShowPreview(true);
      } else {
        throw new Error(data.message || "Failed to load file");
      }
    } catch (error) {
      console.error("Failed to load file content:", error);
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${level * 20}px` }}>
        {node.type === "folder" ? (
          <div>
            <div
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded transition-colors"
              onClick={() => toggleFolder(node.path)}
            >
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
              <Folder className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800 dark:text-gray-200">{node.name}</span>
              {node.children && (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {node.children.length} items
                </span>
              )}
            </div>
            {expandedFolders.has(node.path) && node.children && (
              <div className="ml-2 border-l border-gray-200 dark:border-gray-700">
                {renderFileTree(node.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group transition-colors">
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{node.name}</span>
              <span className="text-xs text-gray-400">
                {node.name.endsWith('.json') ? 'JSON' : node.name.split('.').pop()?.toUpperCase()}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => previewFile(node.path)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={loading}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[85vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              Execution State Files Browser
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </DialogHeader>

          <ScrollArea className="h-[65vh] w-full border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            {loading && !refreshing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading files...</div>
                  <div className="text-sm text-gray-500">Scanning test_execution_state directory</div>
                </div>
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-1">
                {renderFileTree(files)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No execution state files found</p>
                <p className="text-sm text-gray-500 mt-2">Files will appear here after running validations</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Directory
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal with Monaco Editor */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <File className="w-5 h-5 text-green-500" />
              <span>File Preview: {selectedFile?.split('/').pop()}</span>
              <span className="text-sm text-gray-500 font-normal">
                ({selectedFile})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="h-[80vh] w-full border rounded-lg overflow-hidden">
            {selectedFile?.endsWith('.json') ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                value={fileContent}
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
                  monaco.editor.defineTheme('json-custom', {
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
                  monaco.editor.setTheme('json-custom');
                  
                  // Format JSON content
                  try {
                    const formatted = JSON.stringify(JSON.parse(fileContent), null, 2);
                    editor.setValue(formatted);
                  } catch (e) {
                    // Keep original content if JSON is invalid
                  }
                }}
              />
            ) : (
              <div className="h-full bg-gray-900 text-gray-100 p-4 overflow-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {fileContent}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
