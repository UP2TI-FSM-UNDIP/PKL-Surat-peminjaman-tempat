import { useEffect, useRef, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
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
    <div className='mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800'>
      {children}
    </div>
  );
}

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

  const events: EventInput[] = visibleEvents.map((event) => ({
    id: event.id,
    title: `${event.title} · ${event.room.code}`,
    start: `${event.booking_date}T${event.start_time}:00`,
    end: `${event.booking_date}T${event.end_time}:00`,
    backgroundColor: CALENDAR_STATUS_META[event.display_status].color,
    borderColor: CALENDAR_STATUS_META[event.display_status].color,
    extendedProps: { calendarEvent: event },
  }));

  const handleDatesSet = (info: DatesSetArg) => {
    const from = format(info.start, 'yyyy-MM-dd');
    const to = format(subDays(info.end, 1), 'yyyy-MM-dd');

    setRange((previous) =>
      previous.from === from && previous.to === to ? previous : { from, to },
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps.calendarEvent as
      | CalendarEvent
      | undefined;

    if (!event) return;

    setSelectedEvent(event);
    setSelectedDocument(data?.documents[String(event.document_id)]);
    setIsModalOpen(true);
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
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 fc-responsive'>
        <div className='mb-4'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
            Legenda dan filter
          </p>
          <div className='flex flex-wrap gap-2'>
            {CALENDAR_STATUS_ORDER.map((status) => {
              const meta = CALENDAR_STATUS_META[status];
              const isActive = visibleStatuses.includes(status);

              return (
                <button
                  key={status}
                  type='button'
                  aria-pressed={isActive}
                  onClick={() => toggleStatus(status)}
                  className='inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition'
                  style={
                    isActive
                      ? { backgroundColor: meta.color, borderColor: meta.color, color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: meta.color, color: meta.color }
                  }
                >
                  <span
                    className='h-2 w-2 rounded-full'
                    style={{ backgroundColor: isActive ? '#fff' : meta.color }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {isError && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm'>
            Gagal memuat data kalender. Silakan coba lagi.
          </div>
        )}

        {!isFetching && hasNoEvents && (
          <EmptyBanner>Tidak ada reservasi pada rentang ini.</EmptyBanner>
        )}
        {!isFetching && hasFilteredOutEverything && (
          <EmptyBanner>Tidak ada event untuk filter yang dipilih.</EmptyBanner>
        )}

        <div ref={containerRef} className='relative'>
          {isFetching && data && (
            <div className='absolute right-2 top-2 z-10 rounded bg-white/90 px-2 py-1 text-xs text-gray-500 shadow'>
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
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
            dayCellClassNames={(arg) => (arg.isPast ? ['cursor-not-allowed', 'opacity-60'] : ['cursor-pointer'])}
            height={560}
            aspectRatio={1.5}
          />
        </div>
      </div>

      <CalendarEventModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedEvent}
        document={selectedDocument}
      />

      <DateSelectionModal
        open={isDateSelectionModalOpen}
        onOpenChange={setIsDateSelectionModalOpen}
        selectedDate={selectedDate}
      />
    </>
  );
}
