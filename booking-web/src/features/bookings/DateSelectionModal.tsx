import { useNavigate } from '@tanstack/react-router';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Calendar, FileText, Info } from 'lucide-react';
import { getBookingDateIssue } from '@/lib/bookingRules';

interface DateSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: string | null;
}

export function DateSelectionModal({
    open,
    onOpenChange,
    selectedDate,
}: DateSelectionModalProps) {
    const navigate = useNavigate();

    // Tanggal yang diklik di kalender ikut dibawa ke form, kecuali jika tidak
    // memenuhi aturan peminjaman (form akan dibuka tanpa tanggal).
    const dateIssue = selectedDate ? getBookingDateIssue(selectedDate) : null;
    const prefillDate = selectedDate && !dateIssue ? selectedDate : undefined;

    const handleReservasi = () => {
        navigate({
            to: '/peminjam/reservasi',
            search: {
                roomId: undefined,
                roomCode: undefined,
                bookingDate: prefillDate,
                startTime: undefined,
                endTime: undefined,
                purpose: undefined,
                ketuaNama: undefined,
                ketuaNim: undefined,
                ketuaHp: undefined,
            },
        });
        onOpenChange(false);
    };

    const handleAjukanPinjam = () => {
        navigate({
            to: '/peminjam/pinjam/detail-tempat',
            search: {
                editId: undefined,
                roomId: undefined,
                bookingDate: prefillDate,
                startTime: undefined,
                endTime: undefined,
                purpose: undefined,
                ketuaNama: undefined,
                ketuaNim: undefined,
                ketuaHp: undefined,
            },
        });
        onOpenChange(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                        Pilih Jenis Pengajuan
                    </DialogTitle>
                    <DialogDescription className='text-sm text-gray-600'>
                        {selectedDate && (
                            <span className='block mt-2 font-medium text-gray-700'>
                                Tanggal: {formatDate(selectedDate)}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {dateIssue && (
                    <div className='flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
                        <Info className='w-4 h-4 mt-0.5 shrink-0' />
                        <div>
                            <p className='font-medium'>Tanggal ini tidak bisa dipinjam.</p>
                            <p>{dateIssue} Anda tetap bisa melanjutkan dan memilih tanggal lain di form.</p>
                        </div>
                    </div>
                )}

                <div className='grid gap-4 py-4'>
                    <Button
                        onClick={handleReservasi}
                        className='w-full h-auto py-6 flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-700'
                    >
                        <Calendar className='w-8 h-8' />
                        <div className='text-center'>
                            <div className='font-semibold text-lg'>Reservasi</div>
                            <div className='text-xs font-normal opacity-90 mt-1'>
                                Langsung reservasi ruangan untuk tanggal tertentu
                            </div>
                        </div>
                    </Button>

                    <Button
                        onClick={handleAjukanPinjam}
                        className='w-full h-auto py-6 flex flex-col items-center gap-3 bg-green-600 hover:bg-green-700'
                    >
                        <FileText className='w-8 h-8' />
                        <div className='text-center'>
                            <div className='font-semibold text-lg'>Ajukan Pinjam</div>
                            <div className='text-xs font-normal opacity-90 mt-1'>
                                Ajukan peminjaman melalui proses persetujuan
                            </div>
                        </div>
                    </Button>
                </div>

                <div className='flex justify-end'>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        className='text-sm'
                    >
                        Batal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
