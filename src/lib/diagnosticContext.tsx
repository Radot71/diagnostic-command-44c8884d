import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WizardData, OutputConfig, DiagnosticReport, Situation, DiagnosticTier, ReportSource } from './types';

interface DiagnosticContextType {
  wizardData: WizardData;
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
  outputConfig: OutputConfig;
  setOutputConfig: React.Dispatch<React.SetStateAction<OutputConfig>>;
  report: DiagnosticReport | null;
  setReport: React.Dispatch<React.SetStateAction<DiagnosticReport | null>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  reportSource: ReportSource | null;
  setReportSource: React.Dispatch<React.SetStateAction<ReportSource | null>>;
  reportId: string | null;
  setReportId: React.Dispatch<React.SetStateAction<string | null>>;
  resetWizard: () => void;
  loadDemoScenario: (data: WizardData) => void;
  setTier: (tier: DiagnosticTier) => void;
}

const defaultWizardData: WizardData = {
  situation: null,
  companyBasics: {
    companyName: '',
    industry: '',
    revenue: '',
    employees: '',
    founded: '',
  },
  runwayInputs: {
    cashOnHand: '',
    monthlyBurn: '',
    hasDebt: false,
    debtAmount: '',
    debtMaturity: '',
  },
  signalChecklist: {
    signals: [],
    notes: '',
  },
};

const defaultOutputConfig: OutputConfig = {
  mode: 'rapid',
  strictMode: true,
  tier: 'full',
};

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [wizardData, setWizardData] = useState<WizardData>(defaultWizardData);
  const [outputConfig, setOutputConfig] = useState<OutputConfig>(defaultOutputConfig);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [reportSource, setReportSource] = useState<ReportSource | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const resetWizard = () => {
    setWizardData(defaultWizardData);
    setOutputConfig(defaultOutputConfig);
    setReport(null);
    setCurrentStep(0);
    setReportSource(null);
    setReportId(null);
  };

  const loadDemoScenario = (data: WizardData) => {
    setWizardData(data);
    setCurrentStep(0);
  };

  const setTier = (tier: DiagnosticTier) => {
    setOutputConfig(prev => ({ ...prev, tier }));
  };

  return (
    <DiagnosticContext.Provider
      value={{
        wizardData,
        setWizardData,
        outputConfig,
        setOutputConfig,
        report,
        setReport,
        currentStep,
        setCurrentStep,
        reportSource,
        setReportSource,
        reportId,
        setReportId,
        resetWizard,
        loadDemoScenario,
        setTier,
      }}
    >
      {children}
    </DiagnosticContext.Provider>
  );
}

export function useDiagnostic() {
  const context = useContext(DiagnosticContext);
  if (context === undefined) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
}
