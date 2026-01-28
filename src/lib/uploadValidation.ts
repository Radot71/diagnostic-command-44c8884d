import { z } from 'zod';
import { WizardData } from './types';

// Schema for uploaded Decision Packet
export const DecisionPacketSchema = z.object({
  companyBasics: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    revenue: z.string().optional(),
    employees: z.string().optional(),
    founded: z.string().optional(),
  }),
  runwayInputs: z.object({
    cashOnHand: z.string().min(1, 'Cash on hand is required'),
    monthlyBurn: z.string().min(1, 'Monthly burn rate is required'),
    hasDebt: z.boolean().default(false),
    debtAmount: z.string().optional(),
    debtMaturity: z.string().optional(),
  }),
  signalChecklist: z.object({
    signals: z.array(z.string()).default([]),
    notes: z.string().optional().default(''),
  }).optional(),
  situation: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: z.enum(['distress', 'transaction', 'growth', 'governance']).optional(),
    urgency: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    icon: z.string().optional(),
  }).optional().nullable(),
});

export type DecisionPacket = z.infer<typeof DecisionPacketSchema>;

export interface ValidationError {
  field: string;
  message: string;
  path: string[];
}

export interface ValidationResult {
  success: boolean;
  data?: Partial<WizardData>;
  errors: ValidationError[];
  warnings: string[];
}

export function validateDecisionPacket(jsonContent: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  try {
    // First, check if it's valid JSON object
    if (typeof jsonContent !== 'object' || jsonContent === null) {
      return {
        success: false,
        errors: [{ field: 'root', message: 'Invalid JSON structure', path: [] }],
        warnings: [],
      };
    }
    
    // Try parsing with schema
    const result = DecisionPacketSchema.safeParse(jsonContent);
    
    if (result.success) {
      // Convert to WizardData format
      const data: Partial<WizardData> = {
        companyBasics: {
          companyName: result.data.companyBasics.companyName,
          industry: result.data.companyBasics.industry || '',
          revenue: result.data.companyBasics.revenue || '',
          employees: result.data.companyBasics.employees || '',
          founded: result.data.companyBasics.founded || '',
        },
        runwayInputs: {
          cashOnHand: result.data.runwayInputs.cashOnHand,
          monthlyBurn: result.data.runwayInputs.monthlyBurn,
          hasDebt: result.data.runwayInputs.hasDebt,
          debtAmount: result.data.runwayInputs.debtAmount || '',
          debtMaturity: result.data.runwayInputs.debtMaturity || '',
        },
        signalChecklist: {
          signals: result.data.signalChecklist?.signals || [],
          notes: result.data.signalChecklist?.notes || '',
        },
        situation: result.data.situation ? {
          id: result.data.situation.id,
          title: result.data.situation.title,
          description: result.data.situation.description || '',
          category: result.data.situation.category || 'distress',
          urgency: result.data.situation.urgency || 'medium',
          icon: result.data.situation.icon || 'FileText',
        } : null,
      };
      
      // Add warnings for optional missing fields
      if (!result.data.companyBasics.revenue) {
        warnings.push('Revenue not provided - will use industry benchmarks');
      }
      if (!result.data.signalChecklist?.signals.length) {
        warnings.push('No warning signals specified');
      }
      if (result.data.runwayInputs.hasDebt && !result.data.runwayInputs.debtAmount) {
        warnings.push('Debt indicated but amount not specified');
      }
      
      return { success: true, data, errors: [], warnings };
    } else {
      // Parse validation errors
      result.error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.') || 'root',
          message: issue.message,
          path: issue.path.map(String),
        });
      });
      
      return { success: false, errors, warnings };
    }
  } catch (e) {
    return {
      success: false,
      errors: [{ 
        field: 'root', 
        message: e instanceof Error ? e.message : 'Unknown parsing error', 
        path: [] 
      }],
      warnings: [],
    };
  }
}

export function parseJsonFile(content: string): { data: unknown; error: string | null } {
  try {
    const data = JSON.parse(content);
    return { data, error: null };
  } catch (e) {
    return { 
      data: null, 
      error: e instanceof Error ? e.message : 'Invalid JSON format' 
    };
  }
}

// Get user-friendly field names
export function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    'companyBasics.companyName': 'Company Name',
    'companyBasics.industry': 'Industry',
    'companyBasics.revenue': 'Revenue',
    'companyBasics.employees': 'Employee Count',
    'companyBasics.founded': 'Year Founded',
    'runwayInputs.cashOnHand': 'Cash on Hand',
    'runwayInputs.monthlyBurn': 'Monthly Burn Rate',
    'runwayInputs.hasDebt': 'Has Debt',
    'runwayInputs.debtAmount': 'Debt Amount',
    'runwayInputs.debtMaturity': 'Debt Maturity',
    'signalChecklist.signals': 'Warning Signals',
    'signalChecklist.notes': 'Additional Notes',
    'situation.id': 'Situation ID',
    'situation.title': 'Situation Title',
  };
  
  return fieldMap[field] || field;
}
