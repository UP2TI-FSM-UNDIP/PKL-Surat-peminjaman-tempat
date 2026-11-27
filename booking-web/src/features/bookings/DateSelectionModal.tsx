import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Calendar, ChevronRight, FileText } from 'lucide-react';
import { Callout } from '@/components/ui/callout';
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
    // Tampilan minggu/hari mengirim tanggal+jam; aturan dan form memakai tanggal saja.
    const dateOnly = selectedDate ? selectedDate.slice(0, 10) : null;
    const { rulesByDate } = useBookingRules(dateOnly ? [dateOnly] : []);
    const dayRule = dateOnly ? rulesByDate[dateOnly] : undefined;

    const handleContinue = (jenis: 'reservasi' | 'pinjam') => {
        navigate({
            to: '/peminjam/pinjam/baru',
            search: { tanggal: dateOnly ?? undefined, jenis },
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

    const dateIssue = dayRule && !dayRule.is_bookable
        ? dayRule.message || 'Tanggal ini tidak bisa dipinjam.'
        : null;
    // Hari ini (H-0) hanya bisa lewat Ajukan Pinjam.
    const sameDay = !!dayRule?.same_day && !dateIssue;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='gap-5 sm:max-w-[440px]'>
                <DialogHeader className='space-y-1 text-left'>
                    <DialogTitle className='text-[19px] font-semibold tracking-tight'>
                        Pilih jenis pengajuan
                    </DialogTitle>
                    <DialogDescription className='text-[13px] text-muted-foreground'>
                        {selectedDate ? formatDate(selectedDate) : 'Pilih tanggal di kalender.'}
                    </DialogDescription>
                </DialogHeader>

                {dateIssue && (
                    <Callout tone='warning' title='Tanggal ini tidak bisa dipinjam'>
                        {dateIssue} Pilih tanggal lain di kalender.
                    </Callout>
                )}

                {sameDay && (
                    <Callout tone='info' title='Peminjaman hari ini'>
                        Hanya lewat Ajukan Pinjam, dengan proposal lengkap yang diajukan hari ini juga.
                    </Callout>
                )}

                {dayRule?.day_type === 'weekday' && dayRule.is_bookable && !sameDay && (
                    <Callout tone='info'>{WEEKDAY_WARNING}</Callout>
                )}

                <div className='overflow-hidden rounded-xl border border-border bg-white'>
                    <OptionRow
                        icon={<Calendar className='size-[18px]' />}
                        iconClass='bg-[#eaf3fe] text-primary'
                        title='Reservasi'
                        description='Tahan slot dulu, proposal dilengkapi menyusul.'
                        disabled={!!dateIssue || sameDay}
                        disabledNote={sameDay ? 'Tidak tersedia untuk hari ini' : undefined}
                        onClick={() => handleContinue('reservasi')}
                    />
                    <div className='ml-[60px] border-t border-border' />
                    <OptionRow
                        icon={<FileText className='size-[18px]' />}
                        iconClass='bg-[#e8f7ec] text-[#248a3d]'
                        title='Ajukan Pinjam'
                        description='Proposal sudah lengkap, langsung diajukan.'
                        disabled={!!dateIssue}
                        onClick={() => handleContinue('pinjam')}
                    />
                </div>

                <div className='flex justify-end'>
                    <Button variant='secondary' onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function OptionRow({ icon, iconClass, title, description, disabled, disabledNote, onClick }: {
    icon: ReactNode;
    iconClass: string;
    title: string;
    description: string;
    disabled?: boolean;
    disabledNote?: string;
    onClick: () => void;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className='group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent'
        >
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconClass} group-disabled:opacity-40`}>
                {icon}
            </span>
            <span className='min-w-0 flex-1 group-disabled:opacity-45'>
                <span className='block text-[15px] font-semibold text-foreground'>{title}</span>
                <span className='block text-[13px] text-muted-foreground'>{disabled && disabledNote ? disabledNote : description}</span>
            </span>
            <ChevronRight className='size-4 shrink-0 text-[#c7c7cc] transition-transform group-hover:translate-x-0.5 group-disabled:opacity-0' />
        </button>
    );
}
