/**
 * Ensemble Configuration and Runner Tests
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

describe('Ensemble Types', () => {
  it('should have correct 3-pass lens definitions', async () => {
    const { THREE_PASS_LENSES } = await import('@/lib/ensembleTypes');
    
    expect(THREE_PASS_LENSES).toHaveLength(3);
    expect(THREE_PASS_LENSES.map(l => l.id)).toEqual([
      'CORE_DIAGNOSTIC',
      'RISK_AUDIT',
      'SYNTHESIS'
    ]);
  });

  it('should have correct 5-pass lens definitions', async () => {
    const { FIVE_PASS_LENSES } = await import('@/lib/ensembleTypes');
    
    expect(FIVE_PASS_LENSES).toHaveLength(5);
    expect(FIVE_PASS_LENSES.map(l => l.id)).toEqual([
      'CORE_DIAGNOSTIC',
      'RISK_AUDIT',
      'VALUE_LENS',
      'AUDIT_LENS',
      'SYNTHESIS'
    ]);
  });
});

describe('Ensemble Merge Logic', () => {
  it('should create single pass validation with full consensus', async () => {
    const { createSinglePassValidation } = await import('@/lib/ensembleMerge');
    
    const validation = createSinglePassValidation();
    expect(validation.ensemble_mode).toBe('off');
    expect(validation.consensus_score).toBe(1.0);
    expect(validation.material_disagreement).toBe(false);
    expect(validation.fallback_used).toBe(false);
  });

  it('should create fallback validation with disagreement flag', async () => {
    const { createFallbackValidation } = await import('@/lib/ensembleMerge');
    
    const validation = createFallbackValidation('Test error', 1000);
    expect(validation.material_disagreement).toBe(true);
    expect(validation.fallback_used).toBe(true);
    expect(validation.disagreement_notes.length).toBeGreaterThan(0);
    expect(validation.disagreement_notes[0]).toContain('Validation fallback');
  });
});
