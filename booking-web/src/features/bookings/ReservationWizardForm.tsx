import { todayIso } from '@/lib/date';
import { useMemo, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { RoomPicker } from './RoomPicker';
import { toast } from 'sonner';
import { roomService } from '@/services/room.service';
import { reservationService } from '@/services/reservation.service';
import { useBookingRules } from '@/hooks/useBookingRules';
import { useDebounce } from '@/hooks/useDebounce';
import { canBukaSekat, validateSlots, type RoomAdjacency } from '@/lib/slotRules';
import { getErrorMessage } from '@/lib/errors';
import type { ReservationPayload, AvailabilityConflict } from '@/types/reservation';
import type { Document } from '@/types/document';
import type { ReservationContent } from '@/types/reservation';
import { SlotEditor } from './SlotEditor';
import { BukaSekatField } from './BukaSekatField';
import { DayRuleAlert } from './DayRuleAlert';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Callout } from '@/components/ui/callout';

const sectionClass = 'space-y-5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6';
import type { ReservationWizardValues } from './reservationForm.types';

interface Props {
  intent: 'reservation' | 'submit';
  submitLabel?: string;
  /** Tanggal awal (YYYY-MM-DD), misalnya dari klik kalender. */
  initialDate?: string;
  onSuccess: (document: Document<ReservationContent>) => void;
}

const defaults: ReservationWizardValues = {
  mode: 'one_room_many_dates',
  room_id: null,
  booking_date: '',
  slots: [{ room_id: 0, booking_date: '', start_time: '09:00', end_time: '16:30' }],
  purpose: '',
  ketua_pelaksana_nama: '',
  ketua_pelaksana_identitas: '',
  ketua_pelaksana_hp: '',
  expected_participants: '',
  buka_sekat: false,
};

export function ReservationWizardForm({ intent, submitLabel = 'Simpan Reservasi', initialDate, onSuccess }: Props) {
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<ReservationWizardValues>({
    defaultValues: initialDate
      ? { ...defaults, booking_date: initialDate, slots: [{ ...defaults.slots[0], booking_date: initialDate }] }
      : defaults,
  });
  // Ajukan Pinjam (intent submit) adalah alur langsung; hanya alur ini yang boleh H-0.
  const direct = intent === 'submit';
  const mode = useWatch({ control, name: 'mode' });
  const roomId = useWatch({ control, name: 'room_id' });
  const bookingDate = useWatch({ control, name: 'booking_date' });
  const slots = useWatch({ control, name: 'slots' }) ?? [];
  const expectedParticipants = useWatch({ control, name: 'expected_participants' });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [conflicts, setConflicts] = useState<AvailabilityConflict[]>([]);
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({ queryKey: ['rooms', 'ACTIVE'], queryFn: () => roomService.getRooms({ status: 'ACTIVE' }) });
  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const dates = slots.map((slot) => slot.booking_date);
  const { rulesByDate, isLoading: rulesLoading } = useBookingRules(dates);
  const roomsById = useMemo<Record<number, RoomAdjacency | undefined>>(
    () => Object.fromEntries(rooms.map((room) => [room.id, { id: room.id, adjacent_group: room.adjacent_group ?? null, adjacent_position: room.adjacent_position ?? null }])),
    [rooms],
  );
  const primaryDate = mode === 'one_date_many_rooms' ? bookingDate : slots[0]?.booking_date ?? '';
  const activeRule = rulesByDate[primaryDate];
  const allowedRoomIds = activeRule?.rooms.map((room) => room.id);
  const selectableRooms = useMemo(() => {
    if (!allowedRoomIds) return rooms;
    return rooms.filter((room) => allowedRoomIds.includes(room.id) || room.id === roomId);
  }, [allowedRoomIds, roomId, rooms]);
  const maxRows = mode === 'one_room_many_dates'
    ? activeRule?.limits.max_dates_per_room ?? 10
    : activeRule?.limits.max_rooms_per_date ?? 5;

  const debouncedSlots = useDebounce(slots, 700);
  const availabilityQuery = useQuery({
    queryKey: ['availability-batch', debouncedSlots],
    queryFn: () => reservationService.checkAvailabilityBatch(debouncedSlots),
    enabled: debouncedSlots.length > 0 && debouncedSlots.every((slot) => slot.room_id > 0 && slot.booking_date && slot.start_time && slot.end_time),
    staleTime: 15_000,
  });
  const availability = Object.fromEntries((availabilityQuery.data?.slots ?? []).map((slot) => [Number(slot.slot_index), slot.available]));

  function handleApiError(error: unknown) {
    const axiosError = error as AxiosError<{ errors?: { conflicts?: AvailabilityConflict[] } }>;
    const apiConflicts = axiosError.response?.data?.errors?.conflicts ?? [];
    setConflicts(apiConflicts);
    if (apiConflicts.length > 0) {
      const next: Record<number, string[]> = {};
      apiConflicts.forEach((conflict) => {
        slots.forEach((slot, index) => {
          const overlaps = slot.room_id === conflict.room_id
            && slot.booking_date === conflict.booking_date
            && slot.start_time < conflict.end_time
            && slot.end_time > conflict.start_time;
          if (overlaps) next[index] = [...(next[index] ?? []), 'Bentrok dengan booking lain.'];
        });
      });
      setRowErrors(next);
    }
    toast.error(getErrorMessage(error, 'Gagal membuat reservasi.'));
  }

  const mutation = useMutation({
    mutationFn: (payload: ReservationPayload) => reservationService.create(payload),
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      onSuccess(document);
    },
    onError: (error) => handleApiError(error),
  });

  const switchMode = (nextMode: ReservationWizardValues['mode']) => {
    setValue('mode', nextMode);
    setValue('room_id', null);
    setValue('booking_date', '');
    setValue('buka_sekat', false);
    setValue('slots', [{ room_id: 0, booking_date: '', start_time: '09:00', end_time: '16:30' }]);
    setFormErrors([]);
    setRowErrors({});
  };

  const submit = handleSubmit((values) => {
    setConflicts([]);
    if (values.slots.some((slot) => slot.room_id < 1 || !slot.booking_date)) {
      setFormErrors(['Lengkapi ruang dan tanggal pada setiap baris.']);
      return;
    }
    const validation = validateSlots({
      mode: values.mode,
      slots: values.slots,
      rulesByDate,
      limits: activeRule?.limits,
      expectedParticipants: values.expected_participants ? Number(values.expected_participants) : null,
      direct,
    });
    setFormErrors(validation.formErrors);
    setRowErrors(validation.rowErrors);
    if (validation.formErrors.length > 0 || Object.keys(validation.rowErrors).length > 0) return;

    mutation.mutate({
      mode: values.mode,
      slots: values.slots,
      purpose: values.purpose.trim(),
      ketua_pelaksana_nama: values.ketua_pelaksana_nama.trim(),
      ketua_pelaksana_identitas: values.ketua_pelaksana_identitas.trim(),
      ketua_pelaksana_hp: values.ketua_pelaksana_hp.trim(),
      expected_participants: values.expected_participants ? Number(values.expected_participants) : null,
      buka_sekat: values.mode === 'one_date_many_rooms' && values.buka_sekat && canBukaSekat(values.mode, values.slots, roomsById),
      intent,
    });
  }, () => {
    setFormErrors(['Periksa kembali isian.']);
  });

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const filledSlots = slots.filter((slot) => slot.room_id > 0 && slot.booking_date);
  const capacityHint = (() => {
    const ids = [...new Set(filledSlots.map((slot) => slot.room_id))];
    const caps = ids.map((id) => rooms.find((room) => room.id === id)?.capacity).filter((cap): cap is number => !!cap);
    return caps.length ? Math.min(...caps) : null;
  })();

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <section className={sectionClass}>
        <StepHeader step={1} title="Ruang & waktu" description="Pilih ruang, tanggal, dan jam." />

        <div className="space-y-2">
          <Label>Pola peminjaman</Label>
          <SegmentedControl
            ariaLabel="Mode reservasi"
            fullWidth
            value={mode}
            onChange={(next) => switchMode(next)}
            options={[
              { value: 'one_room_many_dates', label: '1 ruang, banyak tanggal' },
              { value: 'one_date_many_rooms', label: '1 tanggal, banyak ruang' },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            {mode === 'one_room_many_dates'
              ? 'Satu ruang dipakai di beberapa tanggal, misalnya rapat rutin.'
              : 'Beberapa ruang dipakai di satu tanggal, misalnya acara besar.'}
          </p>
        </div>

        {mode === 'one_room_many_dates' ? (
          <div className="space-y-2">
            <Label>Ruang</Label>
            <RoomPicker rooms={selectableRooms} value={roomId} onChange={(id) => setValue('room_id', id)} />
            {selectedRoom && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-muted/60 px-3 py-2 text-[12px] text-muted-foreground">
                <span><span className="font-medium text-foreground">{selectedRoom.code}</span> · {selectedRoom.name}</span>
                {selectedRoom.capacity ? <span>Kapasitas {selectedRoom.capacity} orang</span> : null}
                {selectedRoom.is_bookable_weekday === false && <span className="font-medium text-[#a05a00]">Hanya Sabtu–Minggu</span>}
                {selectedRoom.location || selectedRoom.building ? <span>{selectedRoom.location || selectedRoom.building}</span> : null}
                {selectedRoom.facilities?.length ? <span>Fasilitas: {selectedRoom.facilities.join(', ')}</span> : null}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="booking_date">Tanggal</Label>
            <Controller
              control={control}
              name="booking_date"
              render={({ field }) => (
                <DateInput id="booking_date" min={todayIso()} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-label="Tanggal" />
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="md:hidden">{mode === 'one_room_many_dates' ? 'Tanggal & jam' : 'Ruang & jam'}</Label>
          <SlotEditor
            control={control}
            setValue={setValue}
            mode={mode}
            rooms={selectableRooms}
            rulesByDate={rulesByDate}
            maxRows={maxRows}
            rowErrors={rowErrors}
            availability={availability}
          />
        </div>

        <BukaSekatField control={control} roomsById={roomsById} />
        {slots[0]?.booking_date && (mode === 'one_room_many_dates' ? (roomId ?? 0) > 0 : (slots[0]?.room_id ?? 0) > 0) && (
          <DayRuleAlert slot={slots[0]} dayRule={rulesByDate[slots[0].booking_date]} expectedParticipants={expectedParticipants ? Number(expectedParticipants) : null} direct={direct} />
        )}
      </section>

      <section className={sectionClass}>
        <StepHeader step={2} title="Data kegiatan" description="Kegiatan dan penanggung jawab." />
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <Field id="purpose" label="Nama kegiatan" error={errors.purpose?.message} className="md:col-span-2">
            <Input id="purpose" placeholder="Contoh: Seminar Nasional Matematika 2026" {...register('purpose', { required: 'Wajib diisi' })} />
          </Field>
          <Field id="ketua_pelaksana_nama" label="Nama ketua pelaksana" error={errors.ketua_pelaksana_nama?.message}>
            <Input id="ketua_pelaksana_nama" placeholder="Nama lengkap" autoComplete="name" {...register('ketua_pelaksana_nama', { required: 'Wajib diisi' })} />
          </Field>
          <Field id="ketua_pelaksana_identitas" label="NIM/NIP/NIDN" hint="10, 14, atau 18 digit angka" error={errors.ketua_pelaksana_identitas?.message}>
            <Input id="ketua_pelaksana_identitas" inputMode="numeric" placeholder="Contoh: 24060121120001" {...register('ketua_pelaksana_identitas', { required: 'Wajib diisi', pattern: { value: /^(?:\d{10}|\d{14}|\d{18})$/, message: '10, 14, atau 18 digit' } })} />
          </Field>
          <Field id="ketua_pelaksana_hp" label="Nomor HP" hint="12–13 digit, aktif WhatsApp" error={errors.ketua_pelaksana_hp?.message}>
            <Input id="ketua_pelaksana_hp" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" {...register('ketua_pelaksana_hp', { required: 'Wajib diisi', pattern: { value: /^\d{12,13}$/, message: '12–13 digit' } })} />
          </Field>
          <Field id="expected_participants" label="Perkiraan peserta (opsional)" hint={capacityHint ? `Kapasitas ruang terkecil: ${capacityHint} orang` : 'Jumlah orang yang hadir'}>
            <Input id="expected_participants" type="number" min={1} inputMode="numeric" placeholder="Contoh: 40" {...register('expected_participants')} />
          </Field>
        </div>
      </section>

      {formErrors.length > 0 && (
        <Callout tone="danger">
          {formErrors.length === 1 ? formErrors[0] : (
            <ul className="list-disc space-y-0.5 pl-4">{formErrors.map((error) => <li key={error}>{error}</li>)}</ul>
          )}
        </Callout>
      )}
      {conflicts.length > 0 && (
        <Callout tone="danger">Beberapa slot bentrok. Periksa baris yang ditandai.</Callout>
      )}

      <section className={`${sectionClass} sm:flex sm:items-center sm:justify-between sm:gap-6 sm:space-y-0`}>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold">
            {filledSlots.length > 0 ? `${filledSlots.length} slot dipilih` : 'Belum ada slot dipilih'}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {direct
              ? 'Langkah berikutnya: lengkapi proposal dan kebutuhan alat, lalu ajukan.'
              : 'Slot ditahan sampai batas proposal. Lengkapi proposal sebelum batas waktu agar tidak kedaluwarsa.'}
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto" disabled={mutation.isPending || rulesLoading || roomsQuery.isLoading}>
          {mutation.isPending ? 'Menyimpan…' : submitLabel}
        </Button>
      </section>
    </form>
  );
}

function StepHeader({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">{step}</span>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight sm:text-[17px]">{title}</h2>
        <p className="text-xs text-muted-foreground sm:text-[13px]">{description}</p>
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, className, children }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
