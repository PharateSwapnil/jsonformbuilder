import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Folder, FileText, ChevronRight, ChevronDown, Search, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Editor from "@monaco-editor/react";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Organize files by validation type
  const organizedFiles = useMemo(() => {
    const createFiles: FileNode[] = [];
    const updateFiles: FileNode[] = [];
    const deleteFiles: FileNode[] = [];
    const otherFiles: FileNode[] = [];

    const processFiles = (fileList: FileNode[]) => {
      fileList.forEach(file => {
        if (file.type === "folder") {
          if (file.name === "create_validation") {
            createFiles.push(...(file.children || []));
          } else if (file.name === "update_validation") {
            updateFiles.push(...(file.children || []));
          } else if (file.name === "delete_validation") {
            deleteFiles.push(...(file.children || []));
          } else {
            otherFiles.push(file);
          }
        } else {
          otherFiles.push(file);
        }
      });
    };

    processFiles(files);

    return {
      create: createFiles,
      update: updateFiles,
      delete: deleteFiles,
      other: otherFiles,
      all: [...createFiles, ...updateFiles, ...deleteFiles, ...otherFiles]
    };
  }, [files]);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    const currentFiles = organizedFiles[activeTab as keyof typeof organizedFiles] || [];

    if (!searchQuery.trim()) {
      return currentFiles;
    }

    return currentFiles.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [organizedFiles, activeTab, searchQuery]);

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
          <div 
            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group transition-colors cursor-pointer"
            onClick={() => handleFileClick(node)}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{node.name}</span>
              <span className="text-xs text-gray-400">
                {node.name.endsWith('.json') ? 'JSON' : node.name.split('.').pop()?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    ));
  };

  const handleFileClick = async (file: FileNode) => {
    await previewFile(file.path);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[85vh] h-[85vh] p-4">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              Execution State Files Browser
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </DialogHeader>

          <div className="flex gap-4 h-full overflow-hidden">
            <div className="w-2/5 flex flex-col">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Execution State Files
              </h3>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4 mb-3">
                  <TabsTrigger value="all" className="text-xs">
                    All ({organizedFiles.all.length})
                  </TabsTrigger>
                  <TabsTrigger value="create" className="text-xs">
                    Create ({organizedFiles.create.length})
                  </TabsTrigger>
                  <TabsTrigger value="update" className="text-xs">
                    Update ({organizedFiles.update.length})
                  </TabsTrigger>
                  <TabsTrigger value="delete" className="text-xs">
                    Delete ({organizedFiles.delete.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="flex-1 flex flex-col mt-0">
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-sm h-8"
                    />
                  </div>
                  <ScrollArea className="flex-1 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    {loading && !refreshing ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading files...</div>
                          <div className="text-xs text-gray-500">Scanning directory</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        <div className="text-xs text-gray-500 mb-2">
                          {activeTab === "all" ? files.length : filteredFiles.length} {activeTab === "all" ? "items" : "files"} found
                        </div>
                        {(activeTab === "all" ? files.length > 0 : filteredFiles.length > 0) ? (
                          <div className="space-y-1">
                            {activeTab === "all" ? (
                              renderFileTree(files)
                            ) : (
                              filteredFiles.map((file) => (
                                <div 
                                  key={file.path}
                                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group transition-colors cursor-pointer"
                                  onClick={() => handleFileClick(file)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {file.name.endsWith('.json') ? 'JSON' : file.name.split('.').pop()?.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {searchQuery ? 'No files match your search' : 'No execution state files found'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {searchQuery ? 'Try adjusting your search query' : 'Files will appear here after running validations'}
                            </p>
                            {!searchQuery && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                className="mt-3"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Directory
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* File Content Preview */}
            <div className="w-3/5 flex flex-col">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                File Content Preview
                {selectedFile && (
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({selectedFile.split('/').pop()})
                  </span>
                )}
              </h3>
              <div className="flex-1 border rounded-lg overflow-hidden">
                {selectedFile ? (
                  selectedFile.endsWith('.json') ? (
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={fileContent}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        formatOnPaste: true,
                        formatOnType: true,
                        automaticLayout: true,
                        fontSize: 13,
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
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {fileContent}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">Select a file to preview</p>
                      <p className="text-xs mt-1">Click on any file from the list to view its content</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}