import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileJson, AlertCircle, CheckCircle, ArrowLeft, AlertTriangle, Edit3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/PageContainer';
import { toast } from 'sonner';
import { useDiagnostic } from '@/lib/diagnosticContext';
import { 
  validateDecisionPacket, 
  parseJsonFile, 
  getFieldDisplayName,
  ValidationResult 
} from '@/lib/uploadValidation';
import { WizardData } from '@/lib/types';

interface InlineEditField {
  path: string[];
  currentValue: string;
}

export default function UploadPacket() {
  const navigate = useNavigate();
  const { setWizardData } = useDiagnostic();
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
    
    // Read and validate file content
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
    
    // Deep update the parsed data
    const newData = JSON.parse(JSON.stringify(parsedData));
    let obj = newData;
    for (let i = 0; i < editingField.path.length - 1; i++) {
      obj = obj[editingField.path[i]];
    }
    obj[editingField.path[editingField.path.length - 1]] = editValue;
    
    setParsedData(newData);
    setEditingField(null);
    
    // Re-validate
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

  const handleProcess = () => {
    if (!parsedData) return;
    
    // Set wizard data and navigate
    setWizardData(prev => ({
      ...prev,
      ...parsedData,
      companyBasics: { ...prev.companyBasics, ...parsedData.companyBasics },
      runwayInputs: { ...prev.runwayInputs, ...parsedData.runwayInputs },
      signalChecklist: { ...prev.signalChecklist, ...parsedData.signalChecklist },
    }));
    
    toast.success('Decision Packet loaded');
    navigate('/output-mode');
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Upload Decision Packet</h1>
          <p className="text-muted-foreground">
            Upload a DecisionPacketV1 JSON file to generate a diagnostic report. 
            The file will be validated and processed automatically.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`board-card p-12 text-center transition-all cursor-pointer ${
              isDragging ? 'border-accent bg-accent/5' : 'hover:border-accent/50'
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Validation Errors */}
        <AnimatePresence>
          {validationResult && !validationResult.success && validationResult.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="board-card p-4 border-warning/50">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warnings */}
        <AnimatePresence>
          {validationResult?.warnings && validationResult.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="board-card p-4 border-muted-foreground/30">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Preview */}
        <AnimatePresence>
          {parsedData && validationResult?.success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <div className="board-card p-4">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Format Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="board-card p-4 mt-6"
        >
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
        </motion.div>

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
    </PageContainer>
  );
}
