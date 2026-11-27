import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { userService, type User } from '@/services/user.service';
import { roleService, type Role } from '@/services/role.service';
import { unitService, type Unit } from '@/services/unit.service';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailGrid, Field, FormDialog, FormSection } from '@/components/common/FormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UpdateUserData } from '@/services/user.service';

export const Route = createFileRoute('/admin/users/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 0,
    unit_id: 0,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedRoleId, selectedUnitId]);

  // Daftar pengguna (mengikuti halaman & filter). Juga dipanggil ulang setelah
  // tambah/ubah/hapus pengguna.
  const fetchData = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      // Fetch users with filters and pagination
      const response = await userService.getUsers({
        page: currentPage,
        search: debouncedSearchQuery,
        role_id: selectedRoleId,
        unit_id: selectedUnitId,
        per_page: 10,
      });

      setUsers(response.users);
      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        'Gagal memuat data. Silakan coba lagi.',
      );
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedRoleId, selectedUnitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pilihan role & unit untuk filter/form cukup dimuat sekali
  useEffect(() => {
    Promise.all([roleService.getRoles(), unitService.getUnits()])
      .then(([rolesData, unitsData]) => {
        setRoles(rolesData);
        setUnits(unitsData);
      })
      .catch((err) => console.error('Failed to fetch roles/units:', err));
  }, []);

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role_id: roles[0]?.id || 0,
      unit_id: units[0]?.id || 0,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role_id,
      unit_id: user.unit_id,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setFormError('Semua field harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.createUser(formData);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create user:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal membuat user. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedUser) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nama dan email harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
        unit_id: formData.unit_id,
      };

      // Only include password if it's not empty
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await userService.updateUser(selectedUser.id, updateData);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal mengupdate user. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser.id);
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal menghapus user. Silakan coba lagi.',
      );
    }
  };

  const renderUserFields = (isEdit: boolean) => {
    const prefix = isEdit ? 'edit-' : '';
    return (
      <>
        <FormSection title='Akun'>
          <Field label='Nama' htmlFor={`${prefix}name`} required wide>
            <Input id={`${prefix}name`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder='Nama lengkap' required />
          </Field>
          <Field label='Email' htmlFor={`${prefix}email`} required>
            <Input id={`${prefix}email`} type='email' value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder='email@example.com' required />
          </Field>
          <Field label='Password' htmlFor={`${prefix}password`} required={!isEdit} hint={isEdit ? 'Kosongkan bila tidak diubah.' : 'Minimal 8 karakter.'}>
            <Input id={`${prefix}password`} type='password' autoComplete='new-password' value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder='••••••••' required={!isEdit} />
          </Field>
        </FormSection>
        <FormSection title='Peran & unit'>
          <Field label='Role' htmlFor={`${prefix}role_id`} required>
            <Select value={formData.role_id.toString()} onValueChange={(value) => setFormData({ ...formData, role_id: Number(value) })}>
              <SelectTrigger id={`${prefix}role_id`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Unit' htmlFor={`${prefix}unit_id`} required>
            <Select value={formData.unit_id.toString()} onValueChange={(value) => setFormData({ ...formData, unit_id: Number(value) })}>
              <SelectTrigger id={`${prefix}unit_id`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name} ({unit.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>
      </>
    );
  };

  if (isInitialLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl font-semibold tracking-tight text-foreground sm:text-[28px]'>
          Manajemen Pengguna
        </h1>
        <p className='mt-0.5 text-[13px] text-muted-foreground'>
          Kelola pengguna sistem peminjaman ruang
        </p>
      </div>

      {/* Actions Bar */}
      <div className='space-y-3 mb-4 sm:mb-6'>
        <div className='flex items-center gap-2 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Cari user...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 text-sm h-11 border-gray-200 focus:ring-blue-500 rounded-xl shadow-sm w-full bg-white'
            />
          </div>
          <Button
            onClick={handleCreate}
            className='whitespace-nowrap h-11 px-6 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-2'
          >
            <Plus className='h-5 w-5' />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
        <div className='flex flex-row gap-2'>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className='h-9 sm:h-10 text-xs sm:text-sm'>
              <SelectValue placeholder='Filter Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className='h-9 sm:h-10 text-xs sm:text-sm'>
              <SelectValue placeholder='Filter Unit' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Unit</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className='bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] overflow-hidden relative'>
        {/* Subtle Loading Overlay for Updates */}
        {isFetching && !isInitialLoading && (
          <div className='absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center'>
            <div className='bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-xs font-medium text-gray-600'>Memperbarui data...</span>
            </div>
          </div>
        )}

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-8 sm:w-12.5 text-center text-xs sm:text-sm'>
                  No
                </TableHead>
                <TableHead className='text-xs sm:text-sm'>Nama</TableHead>
                <TableHead className='hidden sm:table-cell text-xs sm:text-sm'>
                  Email
                </TableHead>
                <TableHead className='text-xs sm:text-sm'>Role</TableHead>
                <TableHead className='hidden md:table-cell text-xs sm:text-sm'>
                  Unit
                </TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm'>
                  Terdaftar
                </TableHead>
                <TableHead className='text-center text-xs sm:text-sm w-20 sm:w-auto'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchQuery ||
                      selectedRoleId !== 'all' ||
                      selectedUnitId !== 'all'
                      ? 'Tidak ada user yang sesuai dengan filter'
                      : 'Belum ada user'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium text-center text-xs sm:text-sm py-2 sm:py-3'>
                      {(currentPage - 1) * 10 + index + 1}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
                      <div>{user.name}</div>
                      <div className='sm:hidden text-[10px] text-gray-500 mt-0.5'>
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className='hidden sm:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {user.email}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      <span className='inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700'>
                        {user.role?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {user.unit?.name || '-'}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className='py-2 sm:py-3'>
                      <div className='flex items-center justify-center gap-1 sm:gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDetail(user)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(user)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(user)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className='mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-6'>
          <div className='text-xs sm:text-sm text-gray-600 font-medium'>
            Menampilkan{' '}
            <span className='font-bold text-blue-600'>
              {users.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
            </span>{' '}
            -{' '}
            <span className='font-bold text-blue-600'>
              {Math.min(currentPage * 10, totalItems)}
            </span>{' '}
            dari <span className='font-bold text-blue-600'>{totalItems}</span> entri
          </div>
        </div>
        <div className='flex items-center gap-1 sm:gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isFetching}
            className='h-8 px-2 sm:px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50'
          >
            <ChevronLeft className='h-4 w-4 mr-1 sm:mr-2' />
            Prev
          </Button>

          {/* Page numbers */}
          <div className='hidden md:flex items-center gap-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <div key={page} className='flex items-center gap-1'>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className='text-gray-400 px-1'>...</span>
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 text-xs font-medium ${currentPage === page
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || isFetching}
            className='h-8 px-2 sm:px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50'
          >
            Next
            <ChevronRight className='h-4 w-4 ml-1 sm:ml-2' />
          </Button>
        </div>
      </div>

      {/* Create User Modal */}
      <FormDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title='Tambah pengguna'
        description='Lengkapi data akun pengguna baru.'
        size='md'
        onSubmit={handleSubmitCreate}
        submitLabel='Tambah'
        isSubmitting={isSubmitting}
        error={formError}
      >
        {renderUserFields(false)}
      </FormDialog>

      {/* Edit User Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title='Edit pengguna'
        description={selectedUser?.email}
        size='md'
        onSubmit={handleSubmitEdit}
        isSubmitting={isSubmitting}
        error={formError}
      >
        {renderUserFields(true)}
      </FormDialog>

      {/* Detail User Modal */}
      <FormDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        title='Detail pengguna'
        description={selectedUser?.name}
        size='md'
        footer={<Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>}
      >
        {selectedUser && (
          <DetailGrid
            items={[
              ['Nama', selectedUser.name, true],
              ['Email', selectedUser.email, true],
              ['Role', selectedUser.role?.name],
              [
                'Status',
                <span className='inline-flex rounded-full bg-[#e8f8ee] px-2 py-0.5 text-xs font-medium text-[#1f8a4c]'>
                  {selectedUser.status || 'Aktif'}
                </span>,
              ],
              ['Unit', selectedUser.unit ? `${selectedUser.unit.name} (${selectedUser.unit.code})` : null, true],
              ['Terdaftar', new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })],
              ['Diperbarui', new Date(selectedUser.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })],
            ]}
          />
        )}
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user{' '}
              <strong>{selectedUser?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
