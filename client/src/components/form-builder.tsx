import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronDown, Plus, Trash2, PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import { useJsonForm, type FormData, type FormFeature } from "@/hooks/use-json-form";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import featureOptions from "@/components/featureOptions.json";

interface FormBuilderProps {
  data: FormData;
  onChange: (data: FormData) => void;
}

const domainOptions = [
  { value: "land", label: "Land" },
  { value: "gas", label: "Gas" },
  { value: "electric", label: "Electric" },
];

// const featureOptions: Record<string, string[]> = {
//   land: ["land_parcel", "property_boundary", "survey_point"],
//   gas: ["pipeline_device", "directional_text", "derived_field"],
//   electric: ["transmission_line", "distribution_transformer", "service_point"],
// };

const databaseOptions = [
  "Test_&_Raw",
];

export function FormBuilder({ data, onChange }: FormBuilderProps) {
  const {
    formData,
    updateField,
    addFeature,
    removeFeature,
    addAttribute,
    removeAttribute,
    addValidation,
    removeValidation,
    addExpectedResult,
    removeExpectedResult,
  } = useJsonForm();

  const [newAttributeKeys, setNewAttributeKeys] = useState<Record<number, string>>({});
  const [newAttributeValues, setNewAttributeValues] = useState<Record<number, string>>({});
  const [newExpectedKeys, setNewExpectedKeys] = useState<Record<string, string>>({});
  const [newExpectedValues, setNewExpectedValues] = useState<Record<string, string>>({});
  const [testCaseSuggestions, setTestCaseSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // Load test case suggestions from validation.csv
  useEffect(() => {
    const loadTestCaseSuggestions = async () => {
      try {
        const response = await apiRequest("GET", "/api/validation-csv");
        const data = await response.json();
        
        // Extract unique test case IDs from validation data
        const uniqueTestCaseIds = [...new Set(data.map((record: any) => record.test_case_id))]
          .filter(id => id && id.trim() !== '') // Remove empty or undefined IDs
          .sort(); // Sort alphabetically for better UX
        
        setTestCaseSuggestions(uniqueTestCaseIds);
      } catch (error) {
        console.error("Failed to load test case suggestions:", error);
        // Fallback to empty array if API fails
        setTestCaseSuggestions([]);
      }
    };
    
    loadTestCaseSuggestions();
    
    // Set up interval to refresh suggestions every 2 minutes for real-time updates
    const interval = setInterval(loadTestCaseSuggestions, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTestCaseChange = (field: string, value: string) => {
    const updatedData = { ...data, [field]: value };
    onChange(updatedData);
  };

  const handleFeatureChange = (featureIndex: number, field: string, value: any) => {
    const updatedInputs = [...data.inputs];
    updatedInputs[featureIndex] = { ...updatedInputs[featureIndex], [field]: value };
    onChange({ ...data, inputs: updatedInputs });
  };

  const addNewAttribute = (featureIndex: number) => {
    const key = newAttributeKeys[featureIndex];
    const value = newAttributeValues[featureIndex];
    
    if (key && value) {
      const updatedInputs = [...data.inputs];
      updatedInputs[featureIndex].attributes[key] = value;
      onChange({ ...data, inputs: updatedInputs });
      
      setNewAttributeKeys(prev => ({ ...prev, [featureIndex]: "" }));
      setNewAttributeValues(prev => ({ ...prev, [featureIndex]: "" }));
    }
  };

  const removeAttributeHandler = (featureIndex: number, key: string) => {
    const updatedInputs = [...data.inputs];
    delete updatedInputs[featureIndex].attributes[key];
    onChange({ ...data, inputs: updatedInputs });
  };

  const addNewValidation = (featureIndex: number) => {
    const updatedInputs = [...data.inputs];
    updatedInputs[featureIndex].validation.push({
      database: "",
      sql_query: "",
      expected_result: {},
    });
    onChange({ ...data, inputs: updatedInputs });
  };

  const removeValidationHandler = (featureIndex: number, validationIndex: number) => {
    const updatedInputs = [...data.inputs];
    updatedInputs[featureIndex].validation = updatedInputs[featureIndex].validation.filter(
      (_, i) => i !== validationIndex
    );
    onChange({ ...data, inputs: updatedInputs });
  };

  const addNewExpectedResult = (featureIndex: number, validationIndex: number) => {
    const key = newExpectedKeys[`${featureIndex}-${validationIndex}`];
    const value = newExpectedValues[`${featureIndex}-${validationIndex}`];
    
    if (key && value) {
      const updatedInputs = [...data.inputs];
      updatedInputs[featureIndex].validation[validationIndex].expected_result[key] = value;
      onChange({ ...data, inputs: updatedInputs });
      
      setNewExpectedKeys(prev => ({ ...prev, [`${featureIndex}-${validationIndex}`]: "" }));
      setNewExpectedValues(prev => ({ ...prev, [`${featureIndex}-${validationIndex}`]: "" }));
    }
  };

  const addNewFeature = () => {
    const newFeature: FormFeature = {
      feature_sr_no: data.inputs.length + 1,
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
    };
    onChange({ ...data, inputs: [...data.inputs, newFeature] });
  };

  const removeFeatureHandler = (featureIndex: number) => {
    const updatedInputs = data.inputs.filter((_, i) => i !== featureIndex);
    // Renumber features after deletion
    const renumberedInputs = updatedInputs.map((input, index) => ({
      ...input,
      feature_sr_no: index + 1,
    }));
    onChange({ ...data, inputs: renumberedInputs });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Test Case Header */}
      <Card>
        <CardHeader>
          <CardTitle>Test Case Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test_case_id">Test Case ID</Label>
              <Input
                id="test_case_id"
                value={data.test_case_id}
                onChange={(e) => handleTestCaseChange("test_case_id", e.target.value)}
                placeholder="CON0002719-38889"
              />
            </div>
            
            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={data.action}
                onValueChange={(value) => handleTestCaseChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test_case_type">Test Case Type</Label>
              <Select
                value={data.test_case_type}
                onValueChange={(value) => handleTestCaseChange("test_case_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Test Case Description</Label>
            <Textarea
              id="description"
              value={data.test_case_description}
              onChange={(e) => handleTestCaseChange("test_case_description", e.target.value)}
              placeholder="gas.directional referencetext InsertDerivedField"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      {data.inputs.map((feature, featureIndex) => (
        <Card key={featureIndex}>
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {feature.feature_sr_no}
                    </div>
                    <CardTitle>Feature Configuration</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    {data.inputs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFeatureHandler(featureIndex);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Domain</Label>
                    <Select
                      value={feature.domain}
                      onValueChange={(value) => handleFeatureChange(featureIndex, "domain", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {domainOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Feature</Label>
                    <Popover open={open[`feature-${featureIndex}`]} onOpenChange={(isOpen) => setOpen(prev => ({ ...prev, [`feature-${featureIndex}`]: isOpen }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open[`feature-${featureIndex}`]}
                          className="w-full justify-between"
                          disabled={!feature.domain}
                        >
                          {feature.feature ? 
                            feature.feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : 
                            "Search features..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search features..." />
                          <CommandEmpty>No feature found.</CommandEmpty>
                          <CommandGroup>
                            {feature.domain && featureOptions[feature.domain] ? (
                              featureOptions[feature.domain].map((option) => (
                                <CommandItem
                                  key={option}
                                  onSelect={() => {
                                    handleFeatureChange(featureIndex, "feature", option);
                                    setOpen(prev => ({ ...prev, [`feature-${featureIndex}`]: false }));
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      feature.feature === option ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {option.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </CommandItem>
                              ))
                            ) : (
                              <CommandItem disabled>
                                {!feature.domain ? "Select a domain first" : "No features available"}
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>Dependent Test Case</Label>
                    <Popover open={open[featureIndex]} onOpenChange={(isOpen) => setOpen(prev => ({ ...prev, [featureIndex]: isOpen }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open[featureIndex]}
                          className="w-full justify-between"
                        >
                          {feature.dependent_test_case || "Search test cases..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search test cases..." />
                          <CommandEmpty>No test case found.</CommandEmpty>
                          <CommandGroup>
                            {testCaseSuggestions.length > 0 ? (
                              <>
                                {/* Show first 5 suggestions without search */}
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                  Recent Test Cases (Top 5)
                                </div>
                                {testCaseSuggestions.slice(0, 5).map((testCase) => (
                                  <CommandItem
                                    key={`recent-${testCase}`}
                                    onSelect={() => {
                                      handleFeatureChange(featureIndex, "dependent_test_case", testCase);
                                      setOpen(prev => ({ ...prev, [featureIndex]: false }));
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        feature.dependent_test_case === testCase ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {testCase}
                                  </CommandItem>
                                ))}
                                
                                {testCaseSuggestions.length > 5 && (
                                  <>
                                    <div className="border-t my-1"></div>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      All Test Cases (Search above)
                                    </div>
                                    {testCaseSuggestions.slice(5).map((testCase) => (
                                      <CommandItem
                                        key={`all-${testCase}`}
                                        onSelect={() => {
                                          handleFeatureChange(featureIndex, "dependent_test_case", testCase);
                                          setOpen(prev => ({ ...prev, [featureIndex]: false }));
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            feature.dependent_test_case === testCase ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {testCase}
                                      </CommandItem>
                                    ))}
                                  </>
                                )}
                              </>
                            ) : (
                              <CommandItem disabled>
                                Loading test cases...
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Attributes Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium">Attributes</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(feature.attributes).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4">
                        <Input value={key} disabled className="bg-muted" />
                        <div className="flex space-x-2">
                          <Input
                            value={value}
                            onChange={(e) => {
                              const updatedInputs = [...data.inputs];
                              updatedInputs[featureIndex].attributes[key] = e.target.value;
                              onChange({ ...data, inputs: updatedInputs });
                            }}
                            placeholder="Value"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeAttributeHandler(featureIndex, key)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={newAttributeKeys[featureIndex] || ""}
                        onChange={(e) => setNewAttributeKeys(prev => ({ ...prev, [featureIndex]: e.target.value }))}
                        placeholder="Key (e.g., assetgroup)"
                      />
                      <div className="flex space-x-2">
                        <Input
                          value={newAttributeValues[featureIndex] || ""}
                          onChange={(e) => setNewAttributeValues(prev => ({ ...prev, [featureIndex]: e.target.value }))}
                          placeholder="Value"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => addNewAttribute(featureIndex)}
                          disabled={!newAttributeKeys[featureIndex] || !newAttributeValues[featureIndex]}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium">Validation Rules</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addNewValidation(featureIndex)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Validation
                    </Button>
                  </div>
                  
                  {feature.validation.map((validation, validationIndex) => (
                    <Card key={validationIndex} className="mb-4 bg-muted/30">
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <Label>Database</Label>
                          <Select
                            value={validation.database}
                            onValueChange={(value) => {
                              const updatedInputs = [...data.inputs];
                              updatedInputs[featureIndex].validation[validationIndex].database = value;
                              onChange({ ...data, inputs: updatedInputs });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Database" />
                            </SelectTrigger>
                            <SelectContent>
                              {databaseOptions.map((db) => (
                                <SelectItem key={db} value={db}>
                                  {db}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>SQL Query</Label>
                          <Textarea
                            value={validation.sql_query}
                            onChange={(e) => {
                              const updatedInputs = [...data.inputs];
                              updatedInputs[featureIndex].validation[validationIndex].sql_query = e.target.value;
                              onChange({ ...data, inputs: updatedInputs });
                            }}
                            placeholder="select de_state_name from gas.pipelinedevice"
                            className="font-mono text-sm"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label>Expected Results</Label>
                          <div className="space-y-2 mt-2">
                            {Object.entries(validation.expected_result).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2 gap-2">
                                <Input value={key} disabled className="bg-muted" />
                                <div className="flex space-x-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const updatedInputs = [...data.inputs];
                                      updatedInputs[featureIndex].validation[validationIndex].expected_result[key] = e.target.value;
                                      onChange({ ...data, inputs: updatedInputs });
                                    }}
                                    placeholder="Expected Value"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      const updatedInputs = [...data.inputs];
                                      delete updatedInputs[featureIndex].validation[validationIndex].expected_result[key];
                                      onChange({ ...data, inputs: updatedInputs });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={newExpectedKeys[`${featureIndex}-${validationIndex}`] || ""}
                                onChange={(e) => setNewExpectedKeys(prev => ({ 
                                  ...prev, 
                                  [`${featureIndex}-${validationIndex}`]: e.target.value 
                                }))}
                                placeholder="Key"
                              />
                              <div className="flex space-x-2">
                                <Input
                                  value={newExpectedValues[`${featureIndex}-${validationIndex}`] || ""}
                                  onChange={(e) => setNewExpectedValues(prev => ({ 
                                    ...prev, 
                                    [`${featureIndex}-${validationIndex}`]: e.target.value 
                                  }))}
                                  placeholder="Expected Value"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => addNewExpectedResult(featureIndex, validationIndex)}
                                  disabled={
                                    !newExpectedKeys[`${featureIndex}-${validationIndex}`] || 
                                    !newExpectedValues[`${featureIndex}-${validationIndex}`]
                                  }
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeValidationHandler(featureIndex, validationIndex)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Add Feature Button */}
      <Button
        onClick={addNewFeature}
        variant="outline"
        className="w-full h-16 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex items-center justify-center space-x-2"
      >
        <PlusCircle className="w-5 h-5" />
        <span>Add New Feature</span>
      </Button>
    </div>
  );
}
