import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, AlertCircle, CheckCircle, AlertTriangle, Edit3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnterpriseLayout, PageHeader, PageContent } from '@/components/layout/EnterpriseLayout';
import { toast } from 'sonner';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { 
  validateDecisionPacket, 
  parseJsonFile, 
  getFieldDisplayName,
  ValidationResult 
} from '@/lib/uploadValidation';
import { WizardData } from '@/lib/types';
import { generateMockReport } from '@/lib/mockData';
import { saveReport } from '@/lib/reportPersistence';

interface InlineEditField {
  path: string[];
  currentValue: string;
}

export default function UploadPacket() {
  const navigate = useNavigate();
  const { setWizardData, setReport, setOutputConfig, setReportSource, setReportId } = useDiagnostic();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<Partial<WizardData> | null>(null);
  const [editingField, setEditingField] = useState<InlineEditField | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = async (file: File) => {
    setError(null);
    setValidationResult(null);
    setParsedData(null);
    
    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid JSON file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }
    
    try {
      const content = await file.text();
      setFileContent(content);
      setFile(file);
      
      const { data: jsonData, error: parseError } = parseJsonFile(content);
      
      if (parseError) {
        setError(`JSON Parse Error: ${parseError}`);
        return;
      }
      
      const result = validateDecisionPacket(jsonData);
      setValidationResult(result);
      
      if (result.success && result.data) {
        setParsedData(result.data);
        toast.success('File validated successfully');
      } else if (result.errors.length > 0) {
        toast.error('Validation errors found', { 
          description: `${result.errors.length} issue(s) need attention` 
        });
      }
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleInlineEdit = (path: string[], currentValue: string) => {
    setEditingField({ path, currentValue });
    setEditValue(currentValue);
  };

  const saveInlineEdit = () => {
    if (!editingField || !parsedData) return;
    
    const newData = JSON.parse(JSON.stringify(parsedData));
    let obj = newData;
    for (let i = 0; i < editingField.path.length - 1; i++) {
      obj = obj[editingField.path[i]];
    }
    obj[editingField.path[editingField.path.length - 1]] = editValue;
    
    setParsedData(newData);
    setEditingField(null);
    
    const result = validateDecisionPacket(newData);
    setValidationResult(result);
    
    toast.success('Field updated');
  };

  const handleReUpload = () => {
    setFile(null);
    setFileContent('');
    setError(null);
    setValidationResult(null);
    setParsedData(null);
    setEditingField(null);
  };

  const handleProcess = async () => {
    if (!parsedData) return;
    
    const completeData: WizardData = {
      situation: parsedData.situation || null,
      companyBasics: {
        companyName: '',
        industry: '',
        revenue: '',
        employees: '',
        founded: '',
        ...parsedData.companyBasics,
      },
      runwayInputs: {
        cashOnHand: '',
        monthlyBurn: '',
        hasDebt: false,
        debtAmount: '',
        debtMaturity: '',
        ...parsedData.runwayInputs,
      },
      signalChecklist: {
        signals: [],
        notes: '',
        ...parsedData.signalChecklist,
      },
    };
    
    setWizardData(completeData);
    
    // Generate report and navigate to review
    const report = generateMockReport(completeData, 'rapid');
    setReport(report);
    setReportSource('upload');
    setOutputConfig({ mode: 'rapid', strictMode: true, tier: 'full' });
    
    // Persist to database
    try {
      const id = await saveReport({
        report,
        wizardData: completeData,
        outputConfig: { mode: 'rapid', strictMode: true, tier: 'full' },
        source: 'upload',
      });
      setReportId(id);
      toast.success('Decision Packet loaded');
      navigate(`/report/${id}`);
    } catch {
      toast.success('Decision Packet loaded');
      navigate('/report');
    }
  };

  return (
    <EnterpriseLayout>
      <PageHeader 
        title="Upload Decision Packet" 
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Upload' },
        ]}
      />
      <PageContent>
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground mb-6">
            Upload a DecisionPacketV1 JSON file to generate a diagnostic report. 
            The file will be validated and processed automatically.
          </p>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`enterprise-card p-12 text-center transition-all cursor-pointer ${
              isDragging ? 'border-accent bg-accent/5' : 'hover:border-muted-foreground/50'
            } ${file && validationResult?.success ? 'border-success' : ''} ${
              file && validationResult && !validationResult.success ? 'border-warning' : ''
            }`}
            onClick={() => !file && document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-4">
                <div className={`w-16 h-16 rounded-full ${
                  validationResult?.success ? 'bg-success/10' : 'bg-warning/10'
                } flex items-center justify-center mx-auto`}>
                  {validationResult?.success ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleReUpload();
                }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Re-upload
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Drop your DecisionPacketV1 JSON here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Validation Errors */}
          {validationResult && !validationResult.success && validationResult.errors.length > 0 && (
            <div className="mt-4 enterprise-card p-4 border-warning/50">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Validation Errors ({validationResult.errors.length})
              </h3>
              <ul className="space-y-2">
                {validationResult.errors.map((err, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-warning/5 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        Missing: {getFieldDisplayName(err.field)}
                      </span>
                      <p className="text-xs text-muted-foreground">{err.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult?.warnings && validationResult.warnings.length > 0 && (
            <div className="mt-4 enterprise-card p-4">
              <h3 className="font-medium text-muted-foreground mb-2 text-sm">
                Warnings ({validationResult.warnings.length})
              </h3>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="text-xs text-muted-foreground">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Preview */}
          {parsedData && validationResult?.success && (
            <div className="mt-6 enterprise-card p-4">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                Data Preview
              </h3>
              
              <div className="space-y-4">
                {/* Company Basics */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Company Basics</h4>
                  <div className="grid gap-2">
                    {Object.entries(parsedData.companyBasics || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {editingField?.path.join('.') === `companyBasics.${key}` ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 w-32 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {value || '—'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleInlineEdit(['companyBasics', key], value || '')}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Runway Inputs */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Runway & Clock</h4>
                  <div className="grid gap-2">
                    {Object.entries(parsedData.runwayInputs || {}).filter(([key]) => key !== 'hasDebt').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {editingField?.path.join('.') === `runwayInputs.${key}` ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 w-32 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {String(value) || '—'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleInlineEdit(['runwayInputs', key], String(value) || '')}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Format Info */}
          <div className="enterprise-card p-4 mt-6">
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">DecisionPacketV1 Format</h3>
                <p className="text-sm text-muted-foreground">
                  The upload feature expects a JSON file conforming to the DecisionPacketV1 schema. 
                  This includes company basics, financial metrics, situation context, and any supporting evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleProcess} 
              disabled={!parsedData || (validationResult && !validationResult.success)} 
              size="lg"
            >
              Process Decision Packet
            </Button>
          </div>
        </div>
      </PageContent>
    </EnterpriseLayout>
  );
}