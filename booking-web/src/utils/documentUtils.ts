// src/utils/documentUtils.ts
import type { Document } from '@/types/document';

export const documentHelpers = {
  // --- 1. Helpers Umum ---
  getRoomInfo: (doc: Document) => {
    const slot = doc.content?.slots?.[0];
    if (slot?.room_id) {
      return `Ruang ${slot.room_code || slot.room_id}`;
    }
    return '-';
  },

  getBookingDate: (doc: Document) => {
    const bookingDate = doc.content?.slots?.[0]?.booking_date;
    if (bookingDate) {
      return new Date(bookingDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return '-';
  },

  getCurrentHolder: (doc: Document) => {
    if (doc.status === 'IN_PROGRESS' && doc.current_holder) {
      return doc.current_holder.role?.name || doc.current_holder.name;
    }
    return '-';
  },

  getEventName: (doc: Document) => {
    // Prioritaskan event_name (diisi di stepper proposal) atas purpose (dari reservasi awal)
    const eventName = doc.content?.event_name || doc.content?.purpose;
    return eventName ? String(eventName) : 'Tidak ada nama';
  },

  // --- 2. Helpers Ketua Pelaksana ---
  getKetuaPelaksanaNama: (doc: Document) => {
    return doc.content?.ketua_pelaksana_nama
      ? String(doc.content.ketua_pelaksana_nama)
      : '-';
  },

  getKetuaPelaksanaHp: (doc: Document) => {
    return doc.content?.ketua_pelaksana_hp
      ? String(doc.content.ketua_pelaksana_hp)
      : '-';
  },

  // --- 3. Deadline pengajuan ---
  getDeadline: (doc: Document) =>
    doc.reservation_deadline
      ? new Date(`${doc.reservation_deadline}T23:59:59`)
      : null,

  /**
   * Hitung sisa hari hingga deadline.
   */
  getDaysRemaining: (doc: Document) => {
    const deadline = documentHelpers.getDeadline(doc);
    if (!deadline) return null;
    return Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  },

  /**
   * Status deadline: 'expired' | 'critical' | 'warning' | 'safe'
   */
  getDeadlineStatus: (doc: Document) => {
    // Hanya untuk dokumen yang masih harus dilengkapi/diajukan pengaju
    if (doc.status !== 'DRAFT' && doc.status !== 'REVISION') {
      return 'safe';
    }

    const daysRemaining = documentHelpers.getDaysRemaining(doc);
    if (daysRemaining === null) return 'safe';

    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 2) return 'critical';
    if (daysRemaining <= 5) return 'warning';
    return 'safe';
  },

  /**
   * Format text untuk deadline warning
   */
  getDeadlineText: (doc: Document) => {
    const daysRemaining = documentHelpers.getDaysRemaining(doc);
    const deadline = documentHelpers.getDeadline(doc);

    if (daysRemaining === null || !deadline) {
      return '-';
    }
    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} hari lalu`;
    }
    if (daysRemaining === 0) {
      return 'Deadline hari ini!';
    }
    if (daysRemaining === 1) {
      return '1 hari lagi';
    }

    const deadlineStr = deadline.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${daysRemaining} hari lagi (${deadlineStr})`;
  },
};
