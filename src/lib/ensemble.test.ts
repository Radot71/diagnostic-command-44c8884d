/**
 * Validation Configuration and Runner Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getEnsembleConfig, 
  setEnsembleConfig, 
  resetEnsembleConfig,
  isEnsembleActive,
  getPassCount
} from '@/lib/ensembleConfig';

describe('Ensemble Configuration', () => {
  beforeEach(() => {
    resetEnsembleConfig();
  });

  it('should default to ensemble mode off', () => {
    const config = getEnsembleConfig();
    expect(config.mode).toBe('off');
  });

  it('should report ensemble as inactive when mode is off', () => {
    expect(isEnsembleActive()).toBe(false);
  });

  it('should report 1 pass when mode is off', () => {
    expect(getPassCount()).toBe(1);
  });

  it('should update mode to 3pass', () => {
    setEnsembleConfig({ mode: '3pass' });
    expect(getEnsembleConfig().mode).toBe('3pass');
    expect(isEnsembleActive()).toBe(true);
    expect(getPassCount()).toBe(3);
  });

  it('should update mode to 5pass', () => {
    setEnsembleConfig({ mode: '5pass' });
    expect(getEnsembleConfig().mode).toBe('5pass');
    expect(isEnsembleActive()).toBe(true);
    expect(getPassCount()).toBe(5);
  });

  it('should reset to defaults (kill switch)', () => {
    setEnsembleConfig({ mode: '3pass' });
    expect(getEnsembleConfig().mode).toBe('3pass');
    
    resetEnsembleConfig();
    expect(getEnsembleConfig().mode).toBe('off');
    expect(isEnsembleActive()).toBe(false);
  });

  it('should preserve other config values when updating mode', () => {
    const original = getEnsembleConfig();
    setEnsembleConfig({ mode: '3pass' });
    
    const updated = getEnsembleConfig();
    expect(updated.consensusThreshold).toBe(original.consensusThreshold);
    expect(updated.fallbackOnError).toBe(original.fallbackOnError);
  });

  it('should update consensus threshold', () => {
    setEnsembleConfig({ consensusThreshold: 0.8 });
    expect(getEnsembleConfig().consensusThreshold).toBe(0.8);
  });
});

describe('Validation Types', () => {
  it('should have correct 3-pass lens definitions', async () => {
    const { THREE_PASS_VALIDATION_LENSES } = await import('@/lib/validationTypes');
    
    expect(THREE_PASS_VALIDATION_LENSES).toHaveLength(3);
    expect(THREE_PASS_VALIDATION_LENSES.map(l => l.id)).toEqual([
      'CONSISTENCY_LENS',
      'AUDIT_LENS',
      'SYNTHESIS_LENS'
    ]);
  });

  it('should have correct 5-pass lens definitions', async () => {
    const { FIVE_PASS_VALIDATION_LENSES } = await import('@/lib/validationTypes');
    
    expect(FIVE_PASS_VALIDATION_LENSES).toHaveLength(5);
    expect(FIVE_PASS_VALIDATION_LENSES.map(l => l.id)).toEqual([
      'CONSISTENCY_LENS',
      'AUDIT_LENS',
      'RISK_LENS',
      'VALUE_LENS',
      'SYNTHESIS_LENS'
    ]);
  });
});

describe('Validation Runner Logic', () => {
  it('should create default validation with full consensus', async () => {
    const { createDefaultValidation } = await import('@/lib/validationRunner');
    
    const validation = createDefaultValidation();
    expect(validation.ensembleMode).toBe('off');
    expect(validation.consensusScore).toBe(1.0);
    expect(validation.materialDisagreement).toBe(false);
    expect(validation.followUpQuestions).toEqual([]);
  });

  it('should create fallback validation with disagreement flag', async () => {
    const { createFallbackValidation } = await import('@/lib/validationRunner');
    
    const validation = createFallbackValidation('Test error');
    expect(validation.materialDisagreement).toBe(true);
    expect(validation.disagreementNotes.length).toBeGreaterThan(0);
    expect(validation.disagreementNotes[0]).toContain('Validation fallback');
  });
});
