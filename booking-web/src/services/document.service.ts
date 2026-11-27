import api from '@/lib/axios';

// Import Types dan Interface dari file terpisah
import type {
  Document,
  DocumentsResponse,
  SingleDocumentResponse,
} from '@/types/document';

// Export Document type for use in other files
export type { Document };

export const documentService = {
  /**
   * Get list dokumen user
   * Axios otomatis meng-handle query params object
   */
  async getDocuments(filters?: { status?: string; workflow_id?: number; per_page?: number; page_my?: number; page_pending?: number; page_processed?: number; mine?: 1 }) {
    // Optimasi: Gunakan opsi 'params' milik Axios, tidak perlu URLSearchParams manual
    const response = await api.get<DocumentsResponse>('/documents', {
      params: { per_page: 10, ...filters },
    });

    const myDocs = response.data.data.my_documents;
    const pendingDocs = response.data.data.pending_documents;
    const processedDocs = response.data.data.processed_documents;

    return {
      my_documents: myDocs.data,
      pending_documents: pendingDocs.data,
      processed_documents: processedDocs.data,
      // Pagination metadata untuk my_documents
      my_documents_pagination: {
        current_page: myDocs.current_page,
        last_page: myDocs.last_page,
        per_page: myDocs.per_page,
        total: myDocs.total,
        from: myDocs.from,
        to: myDocs.to,
      },
      // Pagination metadata untuk pending_documents
      pending_documents_pagination: {
        current_page: pendingDocs.current_page,
        last_page: pendingDocs.last_page,
        per_page: pendingDocs.per_page,
        total: pendingDocs.total,
        from: pendingDocs.from,
        to: pendingDocs.to,
      },
      // Pagination metadata untuk processed_documents
      processed_documents_pagination: {
        current_page: processedDocs.current_page,
        last_page: processedDocs.last_page,
        per_page: processedDocs.per_page,
        total: processedDocs.total,
        from: processedDocs.from,
        to: processedDocs.to,
      },
    };
  },

  async getDocument(id: number) {
    const response = await api.get<SingleDocumentResponse>(`/documents/${id}`);
    return response.data.data;
  },

  // --- WORKFLOW ACTIONS ---

  async submitDocument(id: number): Promise<Document> {
    const response = await api.post<SingleDocumentResponse>(
      `/documents/${id}/submit`,
    );
    return response.data.data;
  },

  /**
   * Ambil file dokumen sebagai blob beserta object URL untuk preview.
   */
  async fetchFileUrl(documentId: number, type: 'proposal' = 'proposal') {
    const response = await api.get<Blob>(`/documents/${documentId}/file/${type}`, {
      responseType: 'blob',
    });
    if (response.data.type === 'application/json') {
      throw new Error('File tidak ditemukan atau tidak dapat diakses.');
    }
    return { blob: response.data, objectUrl: URL.createObjectURL(response.data) };
  },

  // --- UTILITIES ---

  /**
   * Helper untuk mendownload file binary (PDF/Docx)
   * Menangani Blob creation dan revocation untuk mencegah memory leak
   */
  async downloadFileBlob(url: string, filename: string) {
    try {
      const response = await api.get(url, { responseType: 'blob' });

      // Cek apakah server mengembalikan JSON error alih-alih file (Edge case)
      if (response.data.type === 'application/json') {
        throw new Error('Gagal mengunduh: File tidak ditemukan atau rusak.');
      }

      const href = URL.createObjectURL(response.data);

      // Buat elemen anchor invisible
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', filename);
      document.body.appendChild(link);

      // Trigger click
      link.click();

      // Cleanup DOM & Memory
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Download error:', error);
      throw error; // Lempar error agar bisa ditangkap UI (Toast notif)
    }
  },
};
