import type { Room, RoomType } from '@/services/room.service';

export interface RoomFormData {
  name: string;
  code: string;
  capacity: string;
  description: string;
  facilities: string;
  status: Room['status'];
  type: RoomType | '';
  isBookableWeekday: boolean;
  weekdayMaxEndTime: string;
  adjacentGroup: string;
  adjacentPosition: string;
}

export interface RoomPayload {
  name: string;
  code: string;
  capacity: number | null;
  description: string;
  facilities: string[];
  status: Room['status'];
  type: RoomType | null;
  is_bookable_weekday: boolean;
  weekday_max_end_time: string | null;
  adjacent_group: string | null;
  adjacent_position: number | null;
}

export const emptyRoomForm: RoomFormData = {
  name: '',
  code: '',
  capacity: '',
  description: '',
  facilities: '',
  status: 'ACTIVE',
  type: '',
  isBookableWeekday: false,
  weekdayMaxEndTime: '',
  adjacentGroup: '',
  adjacentPosition: '',
};

export function toRoomFormData(room: Room): RoomFormData {
  return {
    name: room.name,
    code: room.code,
    capacity: room.capacity == null ? '' : String(room.capacity),
    description: room.description ?? '',
    facilities: Array.isArray(room.facilities) ? room.facilities.join(', ') : '',
    status: room.status,
    type: room.type ?? '',
    isBookableWeekday: room.is_bookable_weekday ?? false,
    weekdayMaxEndTime: room.weekday_max_end_time ?? '',
    adjacentGroup: room.adjacent_group ?? '',
    adjacentPosition: room.adjacent_position == null ? '' : String(room.adjacent_position),
  };
}

export function toRoomPayload(formData: RoomFormData): RoomPayload {
  return {
    name: formData.name.trim(),
    code: formData.code.trim(),
    capacity: formData.capacity.trim() === '' ? null : Number(formData.capacity),
    description: formData.description,
    facilities: formData.facilities
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
    status: formData.status,
    type: formData.type || null,
    is_bookable_weekday: formData.isBookableWeekday,
    weekday_max_end_time: formData.weekdayMaxEndTime || null,
    adjacent_group: formData.adjacentGroup.trim() || null,
    adjacent_position:
      formData.adjacentPosition.trim() === ''
        ? null
        : Number(formData.adjacentPosition),
  };
}

export function appendRoomFormData(data: FormData, payload: RoomPayload): void {
  data.append('name', payload.name);
  data.append('code', payload.code);
  if (payload.capacity !== null) {
    data.append('capacity', String(payload.capacity));
  }
  data.append('description', payload.description);
  data.append('status', payload.status);
  payload.facilities.forEach((facility, index) => {
    data.append(`facilities[${index}]`, facility);
  });
  if (payload.type) {
    data.append('type', payload.type);
  }
  data.append('is_bookable_weekday', payload.is_bookable_weekday ? '1' : '0');
  if (payload.weekday_max_end_time) {
    data.append('weekday_max_end_time', payload.weekday_max_end_time);
  }
  if (payload.adjacent_group) {
    data.append('adjacent_group', payload.adjacent_group);
  }
  if (payload.adjacent_position !== null) {
    data.append('adjacent_position', String(payload.adjacent_position));
  }
}
