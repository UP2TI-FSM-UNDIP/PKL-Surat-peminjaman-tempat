import { authStorage } from '@/lib/authStorage';
import { useEffect, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { authService, AUTH_CHANGED_EVENT } from '@/services/auth.service';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export function ProfileCompletionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(authStorage.getItem('userName') ?? '');
  const [nimNip, setNimNip] = useState(authStorage.getItem('userNim') ?? '');

  useEffect(() => {
    const check = () => {
      const token = authStorage.getItem('token');
      setIsOpen(!!token && authStorage.getItem('isProfileCompleted') === 'false');
    };
    check();
    window.addEventListener('storage', check);
    window.addEventListener(AUTH_CHANGED_EVENT, check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener(AUTH_CHANGED_EVENT, check);
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const user = await authService.updateProfile({ name: name.trim(), nim_nip: nimNip.trim() });
      authService.saveUser({ ...user, is_profile_completed: true });
      setIsOpen(false);
      toast.success('Profil berhasil dilengkapi!');
      authService.redirectByRole(user.role?.slug);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan profil. Silakan coba lagi.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Anda</DialogTitle>
          <DialogDescription>Isi nama lengkap dan NIM/NIP. Unit ditetapkan oleh admin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap" required />
          <Input value={nimNip} onChange={(event) => setNimNip(event.target.value)} placeholder="NIM/NIP" required />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
