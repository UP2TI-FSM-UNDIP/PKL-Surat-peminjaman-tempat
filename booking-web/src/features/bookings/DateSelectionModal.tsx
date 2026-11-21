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
import { useBookingRules } from '@/hooks/useBookingRules';

interface DateSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: string | null;
}

const WEEKDAY_WARNING =
    'Peminjaman pada hari Senin–Jumat tetap dapat dilakukan untuk ruang yang diizinkan admin untuk hari kerja, dengan syarat telah dikomunikasikan dengan Bidang Akademik FSM terlebih dahulu.';

export function DateSelectionModal({
    open,
    onOpenChange,
    selectedDate,
}: DateSelectionModalProps) {
    const navigate = useNavigate();
    const { rulesByDate } = useBookingRules(selectedDate ? [selectedDate] : []);
    const dayRule = selectedDate ? rulesByDate[selectedDate] : undefined;

    const handleContinue = () => {
        navigate({ to: '/peminjam/pinjam/baru' });
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

    const dateIssue = dayRule && !dayRule.is_bookable
        ? dayRule.message || 'Tanggal ini tidak bisa dipinjam.'
        : null;

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

                {dayRule?.day_type === 'weekday' && dayRule.is_bookable && (
                    <div className='flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800'>
                        <Info className='w-4 h-4 mt-0.5 shrink-0' />
                        <p>{WEEKDAY_WARNING}</p>
                    </div>
                )}

                <div className='grid gap-4 py-4'>
                    <Button
                        onClick={handleContinue}
                        className='w-full h-auto py-6 flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-700'
                    >
                        <Calendar className='w-8 h-8' />
                        <div className='text-center'>
                            <div className='font-semibold text-lg'>Reservasi</div>
                            <div className='text-xs font-normal opacity-90 mt-1'>
                                Untuk yang belum melengkapi dokumen/proposal
                            </div>
                        </div>
                    </Button>

                    <Button
                        onClick={handleContinue}
                        className='w-full h-auto py-6 flex flex-col items-center gap-3 bg-green-600 hover:bg-green-700'
                    >
                        <FileText className='w-8 h-8' />
                        <div className='text-center'>
                            <div className='font-semibold text-lg'>Ajukan Pinjam</div>
                            <div className='text-xs font-normal opacity-90 mt-1'>
                                Untuk yang sudah melengkapi dokumen/proposal
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
