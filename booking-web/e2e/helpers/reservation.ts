import { expect, type APIRequestContext } from '@playwright/test';
import { API_BASE } from './auth';

interface DraftOptions {
  purpose: string;
  date: string;
  roomCode?: string;
  identity?: string;
}

interface TwoSlotOptions extends DraftOptions {
  secondDate: string;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function findRoomId(request: APIRequestContext, token: string, code: string): Promise<number> {
  const response = await request.get(`${API_BASE}/rooms?per_page=100`, {
    headers: headers(token),
  });
  expect(response.ok()).toBeTruthy();
  const rooms = (await response.json()).data.data as Array<{ id: number; code: string }>;
  const room = rooms.find((item) => item.code === code);

  if (!room) throw new Error(`Ruangan ${code} tidak ditemukan`);

  return room.id;
}

export async function createDraftReservation(
  request: APIRequestContext,
  token: string,
  options: DraftOptions,
): Promise<number> {
  const roomId = await findRoomId(request, token, options.roomCode ?? 'F104');

  const response = await request.post(`${API_BASE}/reservations`, {
    headers: headers(token),
    data: {
      mode: 'one_room_many_dates',
      slots: [{
        room_id: roomId,
        booking_date: options.date,
        start_time: '09:00',
        end_time: '11:00',
      }],
      purpose: options.purpose,
      ketua_pelaksana_nama: 'Budi',
      ketua_pelaksana_identitas: options.identity ?? '21040120140001',
      ketua_pelaksana_hp: '081234567890',
      expected_participants: null,
      buka_sekat: false,
      intent: 'reservation',
    },
  });

  expect(response.ok()).toBeTruthy();

  return (await response.json()).data.id;
}

export async function createTwoSlotDraft(
  request: APIRequestContext,
  token: string,
  options: TwoSlotOptions,
): Promise<number> {
  const roomId = await findRoomId(request, token, options.roomCode ?? 'F104');

  const response = await request.post(`${API_BASE}/reservations`, {
    headers: headers(token),
    data: {
      mode: 'one_room_many_dates',
      slots: [
        {
          room_id: roomId,
          booking_date: options.date,
          start_time: '09:00',
          end_time: '11:00',
        },
        {
          room_id: roomId,
          booking_date: options.secondDate,
          start_time: '09:00',
          end_time: '11:00',
        },
      ],
      purpose: options.purpose,
      ketua_pelaksana_nama: 'Budi',
      ketua_pelaksana_identitas: options.identity ?? '21040120140001',
      ketua_pelaksana_hp: '081234567890',
      expected_participants: null,
      buka_sekat: false,
      intent: 'reservation',
    },
  });

  expect(response.ok()).toBeTruthy();

  return (await response.json()).data.id;
}

export async function submitReservation(
  request: APIRequestContext,
  token: string,
  documentId: number,
  purpose: string,
): Promise<void> {
  const proposal = await request.post(`${API_BASE}/reservations/${documentId}/proposal`, {
    headers: headers(token),
    multipart: {
      _method: 'PUT',
      'content[event_name]': purpose,
      'content[event_nature]': 'Seminar',
      'content[event_form]': 'Offline',
      'content[objectives]': 'Belajar',
      'content[benefits]': 'Ilmu',
      'content[target_audience]': 'Mahasiswa',
      proposal: {
        name: 'proposal.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 test'),
      },
    },
  });
  expect(proposal.ok()).toBeTruthy();

  const submit = await request.post(`${API_BASE}/documents/${documentId}/submit`, {
    headers: headers(token),
  });
  expect(submit.ok()).toBeTruthy();
}
