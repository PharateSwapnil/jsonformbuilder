import { useState, useCallback } from "react";
import type { JsonTestStructure } from "@shared/schema";

export interface FormFeature {
  feature_sr_no: number;
  domain: "land" | "gas" | "electric" | "";
  feature: string;
  dependent_test_case: string;
  dependent_feature_sr_no: number;
  attributes: Record<string, string>;
  validation: Array<{
    database: string;
    sql_query: string;
    expected_result: Record<string, string>;
  }>;
}

export interface FormData {
  test_case_id: string;
  test_case_description: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "";
  test_case_type: "land" | "gas" | "electric" | "";
  inputs: FormFeature[];
}

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

export function useJsonForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const updateField = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key.includes('[') && key.includes(']')) {
          const [arrayKey, indexStr] = key.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          if (!current[arrayKey]) current[arrayKey] = [];
          if (!current[arrayKey][index]) current[arrayKey][index] = {};
          current = current[arrayKey][index];
        } else {
          if (!current[key]) current[key] = {};
          current = current[key];
        }
      }
      
      const lastKey = keys[keys.length - 1];
      if (lastKey.includes('[') && lastKey.includes(']')) {
        const [arrayKey, indexStr] = lastKey.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        if (!current[arrayKey]) current[arrayKey] = [];
        current[arrayKey][index] = value;
      } else {
        current[lastKey] = value;
      }
      
      return newData;
    });
  }, []);

  const addFeature = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      inputs: [
        ...prev.inputs,
        {
          feature_sr_no: prev.inputs.length + 1,
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
    }));
  }, []);

  const removeFeature = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index).map((input, i) => ({
        ...input,
        feature_sr_no: i + 1,
      })),
    }));
  }, []);

  const addAttribute = useCallback((featureIndex: number, key: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      newData.inputs[featureIndex].attributes[key] = value;
      return newData;
    });
  }, []);

  const removeAttribute = useCallback((featureIndex: number, key: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData.inputs[featureIndex].attributes[key];
      return newData;
    });
  }, []);

  const addValidation = useCallback((featureIndex: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      newData.inputs[featureIndex].validation.push({
        database: "",
        sql_query: "",
        expected_result: {},
      });
      return newData;
    });
  }, []);

  const removeValidation = useCallback((featureIndex: number, validationIndex: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      newData.inputs[featureIndex].validation = newData.inputs[featureIndex].validation.filter(
        (_, i) => i !== validationIndex
      );
      return newData;
    });
  }, []);

  const addExpectedResult = useCallback((featureIndex: number, validationIndex: number, key: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      newData.inputs[featureIndex].validation[validationIndex].expected_result[key] = value;
      return newData;
    });
  }, []);

  const removeExpectedResult = useCallback((featureIndex: number, validationIndex: number, key: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData.inputs[featureIndex].validation[validationIndex].expected_result[key];
      return newData;
    });
  }, []);

  const getJsonOutput = useCallback((): JsonTestStructure => {
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
          })),
        },
      ],
    };
  }, [formData]);

  const loadFromJson = useCallback((jsonData: JsonTestStructure) => {
    if (jsonData.tests && jsonData.tests.length > 0) {
      const test = jsonData.tests[0];
      setFormData({
        test_case_id: test.test_case_id,
        test_case_description: test.test_case_description,
        action: test.action,
        test_case_type: test.test_case_type || "",
        inputs: test.inputs.map(input => ({
          ...input,
          dependent_test_case: input.dependent_test_case || "",
        })),
      });
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
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
    getJsonOutput,
    loadFromJson,
    resetForm,
  };
}
