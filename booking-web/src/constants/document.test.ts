import { describe, expect, it } from 'vitest';
import { DOCUMENT_ACTIONS, DOCUMENT_STATUS } from './document';

describe('konstanta dokumen Fase 2', () => {
  it('mengenali status terminal', () => {
    expect(DOCUMENT_STATUS.EXPIRED).toBe('EXPIRED');
    expect(DOCUMENT_STATUS.CANCELLED).toBe('CANCELLED');
  });

  it('mengenali aksi timeline baru', () => {
    expect(DOCUMENT_ACTIONS.UPDATED).toBe('UPDATED');
    expect(DOCUMENT_ACTIONS.EXPIRED).toBe('EXPIRED');
    expect(DOCUMENT_ACTIONS.CANCELLED).toBe('CANCELLED');
  });
});
