export const COMPLETENESS_LABELS: Record<string, string> = {
  event_name: 'Nama kegiatan',
  event_nature: 'Sifat kegiatan',
  event_form: 'Bentuk kegiatan',
  objectives: 'Tujuan kegiatan',
  benefits: 'Manfaat',
  target_audience: 'Sasaran peserta',
  ketua_pelaksana_nama: 'Nama ketua pelaksana',
  ketua_pelaksana_identitas: 'NIM/NIP/NIDN ketua',
  ketua_pelaksana_hp: 'Nomor HP ketua',
  file_proposal: 'Proposal PDF',
  slots: 'Slot reservasi',
};

export function missingLabels(keys: string[]): string[] {
  return keys.map((key) => COMPLETENESS_LABELS[key] ?? key);
}
