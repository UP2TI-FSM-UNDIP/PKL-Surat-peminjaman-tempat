import { useState } from 'react';
import { Check, Loader2, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/services/auth.service';
import { devService, type DevAccount, type DevSession } from '@/services/dev.service';

interface DevAccountSwitcherProps {
  session: DevSession;
  currentUserId?: number;
}

export function DevAccountSwitcher({ session, currentUserId }: DevAccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwitch = async (account: DevAccount) => {
    if (switchingId !== null) return;

    setSwitchingId(account.user_id);
    setError(null);

    try {
      const response = await devService.login(account.user_id);
      authService.saveAuthData(response);
      setOpen(false);
      authService.redirectByRole(response.user.role?.slug ?? account.role.slug);
    } catch {
      setError('Gagal berpindah akun. Pastikan API lokal hidup dan AUTH_DEV_LOGIN aktif.');
      setSwitchingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <button
        type='button'
        onClick={() => setOpen(true)}
        title='Ganti akun (dev)'
        className='inline-flex h-8 items-center gap-2 rounded-full bg-secondary px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-[#e3e3e8] active:scale-[0.98]'
      >
        <UserCog className='h-4 w-4' />
        <span className='hidden sm:inline'>Ganti akun</span>
      </button>

      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Ganti akun (dev)</DialogTitle>
          <DialogDescription>
            Hanya tersedia di API lokal. Setiap perpindahan menerbitkan token baru
            dan memuat ulang halaman.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] divide-y overflow-y-auto rounded-lg border'>
          {session.accounts.map((account) => {
            const isCurrent = account.user_id === currentUserId;
            const isSwitching = switchingId === account.user_id;

            return (
              <button
                key={account.user_id}
                type='button'
                disabled={isCurrent || switchingId !== null}
                onClick={() => handleSwitch(account)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                  isCurrent ? 'bg-muted/60' : 'hover:bg-muted/40'
                } disabled:cursor-not-allowed`}
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-foreground'>
                    {account.name}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>{account.email}</p>
                  <p className='truncate text-xs text-muted-foreground'>{account.unit.name}</p>
                </div>

                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='secondary'>{account.role.name}</Badge>
                  {isCurrent && <Check className='h-4 w-4 text-primary' />}
                  {isSwitching && <Loader2 className='h-4 w-4 animate-spin text-primary' />}
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className='text-sm text-destructive'>{error}</p>}

        <p className='text-xs text-muted-foreground'>
          Akun default: admin. Login dev dicatat di log API dan hanya menerima
          request dari 127.0.0.1.
        </p>
      </DialogContent>
    </Dialog>
  );
}
