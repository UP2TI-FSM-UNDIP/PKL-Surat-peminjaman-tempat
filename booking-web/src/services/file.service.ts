import api from '@/lib/axios';

export const fileService = {
  async fetchBlobUrl(url: string): Promise<{ blob: Blob; objectUrl: string }> {
    const response = await api.get<Blob>(url, { responseType: 'blob' });
    if (response.data.type === 'application/json') {
      throw new Error('File tidak ditemukan atau tidak dapat diakses.');
    }
    return { blob: response.data, objectUrl: URL.createObjectURL(response.data) };
  },

  async download(url: string, filename: string): Promise<void> {
    const { objectUrl } = await this.fetchBlobUrl(url);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
