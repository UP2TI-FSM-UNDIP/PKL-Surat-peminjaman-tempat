import { useEffect, useRef, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { bookingService } from '@/services/booking.service';
import type {
  CalendarDisplayStatus,
  CalendarDocument,
  CalendarEvent,
} from '@/types/calendar';
import { CalendarEventModal } from './CalendarEventModal';
import { DateSelectionModal } from './DateSelectionModal';
import { DayBookingsModal } from './DayBookingsModal';
import { Callout } from '@/components/ui/callout';
import {
  CALENDAR_STATUS_META,
  CALENDAR_STATUS_ORDER,
  DEFAULT_VISIBLE_STATUSES,
  filterCalendarEvents,
} from './calendarStatus';

interface VisibleRange {
  from: string;
  to: string;
}

function EmptyBanner({ children }: { children: ReactNode }) {
  return (
    <p className='mb-4 text-[13px] text-muted-foreground'>{children}</p>
  );
}

const STATUS_HINT: Partial<Record<CalendarDisplayStatus, string>> = {
  active: 'Proposal lengkap — klik event untuk rangkuman',
  reservation: 'Proposal belum lengkap',
};

export default function BookingCalendar() {
  const [range, setRange] = useState<VisibleRange>(() => ({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  }));
  const [visibleStatuses, setVisibleStatuses] =
    useState<CalendarDisplayStatus[]>(DEFAULT_VISIBLE_STATUSES);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<CalendarDocument | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateSelectionModalOpen, setIsDateSelectionModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayListDate, setDayListDate] = useState<string | null>(null);
  const [isDayListOpen, setIsDayListOpen] = useState(false);
  const [dayListMode, setDayListMode] = useState<'active' | 'all'>('active');

  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Belum ada UI filter ruangan; parameter disiapkan agar penambahan nanti
  // tidak mengubah bentuk query key.
  const roomId: number | undefined = undefined;

  const { data, isError, isFetching } = useQuery({
    queryKey: ['calendar', range.from, range.to, roomId ?? null],
    queryFn: () =>
      bookingService.getCalendar({
        from: range.from,
        to: range.to,
        room_id: roomId,
      }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const visibleEvents = filterCalendarEvents(data?.events ?? [], visibleStatuses);

  const events: EventInput[] = visibleEvents.map((event) => {
    const color = CALENDAR_STATUS_META[event.display_status].color;
    return {
      id: event.id,
      title: event.title,
      start: `${event.booking_date}T${event.start_time}:00`,
      end: `${event.booking_date}T${event.end_time}:00`,
      // Warna lembut: latar tipis + garis kiri berwarna; teks tetap gelap.
      backgroundColor: `${color}1f`,
      borderColor: color,
      textColor: '#1d1d1f',
      classNames: ['fsm-event'],
      extendedProps: { calendarEvent: event, color },
    };
  });

  const renderEvent = (arg: EventContentArg) => {
    const event = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    const color = arg.event.extendedProps.color as string;
    const time = event ? event.start_time.slice(0, 5) : arg.timeText;
    const room = event?.room.code ?? '';
    const title = arg.event.title || 'Tanpa judul';
    if (arg.view.type === 'dayGridWeek') {
      // Tampilan minggu: kartu bertumpuk per hari, urut jam — rapi walau banyak booking.
      return (
        <div className='fsm-event-card' title={`${time}–${event?.end_time.slice(0, 5) ?? ''} · ${title} · ${room}`}>
          <span className='fsm-event-title'>{title}</span>
          <span className='fsm-event-meta'>
            {time}–{event?.end_time.slice(0, 5) ?? ''}
            {room && <span className='fsm-event-chip'>{room}</span>}
          </span>
        </div>
      );
    }
    if (arg.view.type === 'dayGridMonth') {
      return (
        <div className='fsm-event-month' title={`${time} · ${title} · ${room}`}>
          <span className='fsm-event-dot' style={{ backgroundColor: color }} />
          <span className='fsm-event-time'>{time}</span>
          <span className='fsm-event-title'>{title}</span>
          <span className='fsm-event-room'>{room}</span>
        </div>
      );
    }
    return (
      <div className='fsm-event-block' title={`${time}–${event?.end_time.slice(0, 5) ?? ''} · ${title} · ${room}`}>
        <span className='fsm-event-title'>{title}</span>
        <span className='fsm-event-meta'>{time} · {room}</span>
      </div>
    );
  };

  const handleDatesSet = (info: DatesSetArg) => {
    const from = format(info.start, 'yyyy-MM-dd');
    const to = format(subDays(info.end, 1), 'yyyy-MM-dd');

    setRange((previous) =>
      previous.from === from && previous.to === to ? previous : { from, to },
    );
  };

  // Peminjaman aktif (hijau) per tanggal, untuk tabel "semua hari ini".
  const activeOn = (date: string | null) =>
    date ? (data?.events ?? []).filter((e) => e.display_status === 'active' && e.booking_date === date) : [];

  const openEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDocument(data?.documents[String(event.document_id)]);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps.calendarEvent as
      | CalendarEvent
      | undefined;

    if (!event) return;
    openEvent(event);
  };

  const handleDateClick = (dateInfo: DateClickArg) => {
    // Tanggal yang sudah lewat tidak bisa diajukan, jadi tidak membuka pilihan pengajuan.
    if (dateInfo.dateStr.slice(0, 10) < format(new Date(), 'yyyy-MM-dd')) return;
    setSelectedDate(dateInfo.dateStr);
    setIsDateSelectionModalOpen(true);
  };

  const toggleStatus = (status: CalendarDisplayStatus) => {
    setVisibleStatuses((previous) =>
      previous.includes(status)
        ? previous.filter((item) => item !== status)
        : [...previous, status],
    );
  };

  const hasNoEvents = !!data && data.events.length === 0;
  const hasFilteredOutEverything =
    !!data && data.events.length > 0 && visibleEvents.length === 0;

  return (
    <>
      <div className='bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] p-4 sm:p-6 fc-responsive'>
        <div className='mb-5 flex flex-wrap items-center gap-x-3 gap-y-2'>
          <span className='text-[13px] font-medium text-muted-foreground'>Tampilkan</span>
          <div className='flex flex-wrap gap-1.5'>
            {CALENDAR_STATUS_ORDER.map((status) => {
              const meta = CALENDAR_STATUS_META[status];
              const isActive = visibleStatuses.includes(status);

              return (
                <button
                  key={status}
                  type='button'
                  aria-pressed={isActive}
                  title={STATUS_HINT[status]}
                  onClick={() => toggleStatus(status)}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary text-foreground hover:bg-[#e3e3e8]'
                      : 'bg-transparent text-muted-foreground/70 line-through decoration-1 hover:bg-muted'
                  }`}
                >
                  <span
                    className='h-2 w-2 rounded-full'
                    style={{ backgroundColor: meta.color, opacity: isActive ? 1 : 0.35 }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {isError && (
          <Callout tone='danger' className='mb-4'>Gagal memuat data kalender. Silakan coba lagi.</Callout>
        )}

        {!isFetching && hasNoEvents && (
          <EmptyBanner>Tidak ada reservasi pada rentang ini.</EmptyBanner>
        )}
        {!isFetching && hasFilteredOutEverything && (
          <EmptyBanner>Tidak ada event untuk filter yang dipilih.</EmptyBanner>
        )}

        <div ref={containerRef} className='relative'>
          {isFetching && data && (
            <div className='absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur'>
              Memuat…
            </div>
          )}

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,timeGridDay',
            }}
            buttonText={{
              today: 'Hari Ini',
              month: 'Bulan',
              week: 'Minggu',
              day: 'Hari',
            }}
            locale='id'
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEvent}
            eventDisplay='block'
            dayCellClassNames={(arg) => (arg.isPast && !arg.isToday ? ['fsm-day-past', 'cursor-not-allowed'] : ['cursor-pointer'])}
            height='auto'
            allDaySlot={false}
            slotMinTime='07:00:00'
            slotMaxTime='18:00:00'
            slotDuration='00:30:00'
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            dayHeaderFormat={{ weekday: 'short' }}
            views={{
              dayGridWeek: {
                dayHeaderFormat: { weekday: 'short', day: 'numeric' },
                dayMaxEvents: false,
                eventOrder: 'start,title',
              },
              timeGridDay: {
                dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' },
                eventMaxStack: 4,
              },
            }}
            dayMaxEvents={3}
            eventMaxStack={2}
            moreLinkContent={(arg) => `+${arg.num} lainnya`}
            moreLinkClick={(arg) => {
              // Ganti popover bawaan (berantakan bila event banyak) dengan tabel semua peminjaman hari itu.
              setDayListMode('all');
              setDayListDate(format(arg.date, 'yyyy-MM-dd'));
              setIsDayListOpen(true);
              // Nilai truthy non-string: FullCalendar tidak membuka popover maupun pindah view.
              return {} as unknown as string;
            }}
            nowIndicator
            expandRows
          />
        </div>
      </div>

      <CalendarEventModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedEvent}
        document={selectedDocument}
        dayActiveCount={activeOn(selectedEvent?.booking_date ?? null).length}
        onShowDay={() => {
          setDayListMode('active');
          setDayListDate(selectedEvent?.booking_date ?? null);
          setIsModalOpen(false);
          setIsDayListOpen(true);
        }}
      />

      <DayBookingsModal
        open={isDayListOpen}
        onOpenChange={setIsDayListOpen}
        date={dayListDate}
        mode={dayListMode}
        events={dayListMode === 'all' ? visibleEvents.filter((e) => e.booking_date === dayListDate) : activeOn(dayListDate)}
        documents={data?.documents ?? {}}
        onSelect={(event) => {
          setIsDayListOpen(false);
          openEvent(event);
        }}
      />

      <DateSelectionModal
        open={isDateSelectionModalOpen}
        onOpenChange={setIsDateSelectionModalOpen}
        selectedDate={selectedDate}
      />
    </>
  );
}
