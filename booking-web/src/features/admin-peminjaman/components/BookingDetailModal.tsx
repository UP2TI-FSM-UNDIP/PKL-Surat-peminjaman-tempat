import { formatTimeRange } from '@/lib/date';
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { RoomBooking } from '@/services/room.service';

interface BookingDetailModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    booking: RoomBooking | null;
    statusBadge: (status: string) => React.ReactNode;
}

export function BookingDetailModal({
    isOpen,
    onOpenChange,
    booking,
    statusBadge
}: BookingDetailModalProps) {
    if (!booking) return null;

    const unitCode = booking.booked_by_user?.unit_code || booking.bookedBy?.unit?.code || '-';
    const borrowerName = booking.booked_by_user?.name || booking.bookedBy?.name || '-';
    const roomName = booking.room?.code || booking.room?.name || '-';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-125'>
                <DialogHeader>
                    <DialogTitle>Detail Peminjaman</DialogTitle>
                    <DialogDescription>
                        Informasi lengkap tentang peminjaman ruangan
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <p className='text-sm font-medium text-gray-500'>Status</p>
                            {statusBadge(booking.status)}
                        </div>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Ruangan</p>
                        <p className='text-sm text-gray-900'>{roomName}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Kode Unit</p>
                        <p className='text-sm text-gray-900'>{unitCode}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Nama Peminjam</p>
                        <p className='text-sm text-gray-900'>{borrowerName}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Tanggal</p>
                        <p className='text-sm text-gray-900'>
                            {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Waktu</p>
                        <p className='text-sm text-gray-900'>
                            {formatTimeRange(booking.start_time, booking.end_time)}
                        </p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Keperluan</p>
                        <p className='text-sm text-gray-900'>{booking.purpose || '-'}</p>
                    </div>
                    {booking.document && (
                        <div>
                            <p className='text-sm font-medium text-gray-500'>Dokumen</p>
                            <p className='text-sm text-gray-900'>{booking.document.title || '-'}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
