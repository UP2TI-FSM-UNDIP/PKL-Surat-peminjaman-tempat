import { describe, expect, it } from 'vitest';
import { missingLabels } from './completeness';

describe('missingLabels', () => {
  it('memetakan key ke label manusiawi', () => {
    expect(missingLabels(['file_proposal', 'event_name'])).toEqual(['Proposal PDF', 'Nama kegiatan']);
  });

  it('memakai key sebagai fallback', () => {
    expect(missingLabels(['unknown_key'])).toEqual(['unknown_key']);
  });
});
