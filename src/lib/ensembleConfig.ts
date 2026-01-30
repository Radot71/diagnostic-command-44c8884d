/**
 * Multi-Pass Diagnostic Validation Configuration
 * 
 * Feature flag and configuration for the ensemble validation system.
 * This enables multi-pass prompt ensembling for improved diagnostic reliability.
 */

export type EnsembleMode = 'off' | '3pass' | '5pass';

export interface EnsembleConfig {
  mode: EnsembleMode;
  enableDevPanel: boolean;
  fallbackOnError: boolean;
  consensusThreshold: number;
  materialDisagreementThresholds: {
    valueVariancePercent: number;
    roiFlipDetection: boolean;
    diagnosisCodeMismatch: boolean;
  };
}

// Default configuration - ensemble is OFF by default (kill switch)
const defaultConfig: EnsembleConfig = {
  mode: 'off',
  enableDevPanel: import.meta.env.DEV || false,
  fallbackOnError: true,
  consensusThreshold: 0.7,
  materialDisagreementThresholds: {
    valueVariancePercent: 30,
    roiFlipDetection: true,
    diagnosisCodeMismatch: true,
  },
};

// Runtime configuration - can be modified via setEnsembleConfig
let runtimeConfig: EnsembleConfig = { ...defaultConfig };

/**
 * Get the current ensemble configuration
 */
export function getEnsembleConfig(): EnsembleConfig {
  return { ...runtimeConfig };
}

/**
 * Update ensemble configuration at runtime
 * Used for feature flag toggling and developer overrides
 */
export function setEnsembleConfig(updates: Partial<EnsembleConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...updates };
  
  // Log configuration changes in dev mode
  if (runtimeConfig.enableDevPanel) {
    console.log('[DiagnosticOS:Ensemble] Configuration updated:', runtimeConfig);
  }
}

/**
 * Reset to default configuration (kill switch)
 */
export function resetEnsembleConfig(): void {
  runtimeConfig = { ...defaultConfig };
  console.log('[DiagnosticOS:Ensemble] Configuration reset to defaults (ensemble OFF)');
}

/**
 * Check if ensemble mode is active
 */
export function isEnsembleActive(): boolean {
  return runtimeConfig.mode !== 'off';
}

/**
 * Get the number of passes for current mode
 */
export function getPassCount(): number {
  switch (runtimeConfig.mode) {
    case '3pass': return 3;
    case '5pass': return 5;
    default: return 1;
  }
}
