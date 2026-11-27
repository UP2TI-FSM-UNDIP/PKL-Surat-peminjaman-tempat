import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { unitService, UNIT_CATEGORIES, type Unit, type UnitCategory } from '@/services/unit.service';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
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
import type { User } from '@/services/user.service';

export const Route = createFileRoute('/admin/units/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | UnitCategory>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'HMD' as UnitCategory,
    parent_id: undefined as number | undefined,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [unitUsers, setUnitUsers] = useState<User[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter units based on search and category
  useEffect(() => {
    let filtered = units;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (unit) =>
          unit.name.toLowerCase().includes(query) ||
          unit.code.toLowerCase().includes(query) ||
          unit.description?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((unit) => unit.category === selectedCategory);
    }

    setFilteredUnits(filtered);
  }, [debouncedSearchQuery, units, selectedCategory]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const data = await unitService.getUnits();
      setUnits(data);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        'Gagal memuat data unit. Silakan coba lagi.',
      );
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'HMD',
      parent_id: undefined,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      description: unit.description || '',
      category: unit.category,
      parent_id: unit.parent_id,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDelete = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDetail = async (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
    setIsLoadingUsers(true);

    try {
      const response = await api.get(`/users?unit_id=${unit.id}`);
      setUnitUsers(response.data.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUnitUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Nama dan kode harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await unitService.createUnit({
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        category: formData.category,
        parent_id: formData.parent_id,
      });
      setIsCreateModalOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to create unit:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal membuat unit. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedUnit) return;

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Nama dan kode harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await unitService.updateUnit(selectedUnit.id, {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        category: formData.category,
        parent_id: formData.parent_id,
      });
      setIsEditModalOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to update unit:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal mengupdate unit. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUnit) return;

    try {
      await unitService.deleteUnit(selectedUnit.id);
      setIsDeleteDialogOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to delete unit:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal menghapus unit. Silakan coba lagi.',
      );
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      FAKULTAS: 'bg-blue-100 text-blue-700',
      DEPARTEMEN: 'bg-green-100 text-green-700',
      HMD: 'bg-purple-100 text-purple-700',
      BEM: 'bg-orange-100 text-orange-700',
      SENAT: 'bg-amber-100 text-amber-700',
      UKM: 'bg-teal-100 text-teal-700',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}
      >
        {category}
      </span>
    );
  };

  const renderUnitFields = (isEdit: boolean) => {
    const prefix = isEdit ? 'edit-' : '';
    return (
      <FormSection>
        <Field label='Nama unit' htmlFor={`${prefix}name`} required wide>
          <Input id={`${prefix}name`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder='Contoh: Program Studi Informatika' required />
        </Field>
        <Field label='Kode unit' htmlFor={`${prefix}code`} required>
          <Input id={`${prefix}code`} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder='Contoh: PRODI-IF' required />
        </Field>
        <Field label='Kategori' htmlFor={`${prefix}category`} required>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as UnitCategory })}>
            <SelectTrigger id={`${prefix}category`} className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label='Unit induk' htmlFor={`${prefix}parent_id`} wide>
          <Select
            value={formData.parent_id?.toString() || 'none'}
            onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? undefined : Number(value) })}
          >
            <SelectTrigger id={`${prefix}parent_id`} className='w-full'>
              <SelectValue placeholder='Pilih unit induk' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>Tidak ada</SelectItem>
              {units
                .filter((unit) => !isEdit || unit.id !== selectedUnit?.id)
                .map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name} ({unit.code})</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label='Deskripsi' htmlFor={`${prefix}description`} wide>
          <Input id={`${prefix}description`} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder='Deskripsi singkat (opsional)' />
        </Field>
      </FormSection>
    );
  };

  if (isInitialLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Memuat data unit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchUnits}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl font-semibold tracking-tight text-foreground sm:text-[28px]'>
          Manajemen Unit
        </h1>
        <p className='mt-0.5 text-[13px] text-muted-foreground'>
          Kelola unit organisasi dalam sistem
        </p>
      </div>

      <div className='mb-6 space-y-4'>
        {/* Search & Add Button Row */}
        <div className='flex items-center gap-2 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Cari unit...'
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
            <span>Tambah Unit</span>
          </Button>
        </div>

        {/* Filters Row - Chips */}
        <div className='flex flex-col md:flex-row items-start md:items-center gap-4 pt-1'>
          <SegmentedControl
            ariaLabel='Filter kategori unit'
            value={selectedCategory}
            onChange={(value) =>
              setSelectedCategory(value as 'all' | UnitCategory)
            }
            options={[
              { value: 'all', label: 'Semua Kategori' },
              ...UNIT_CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
              })),
            ]}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className='bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] overflow-hidden relative'>
        {/* Subtle Loading Overlay for Updates */}
        {isFetching && !isInitialLoading && (
          <div className='absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center text-center'>
            <div className='bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-xs font-medium text-gray-600'>Memperbarui data...</span>
            </div>
          </div>
        )}
        <div className='overflow-x-auto max-w-full'>
          <Table className='w-full min-w-[640px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='hidden sm:table-cell w-8 sm:w-12 text-center text-xs sm:text-sm'>ID</TableHead>
                <TableHead className='text-xs sm:text-sm w-[25%]'>Nama Unit</TableHead>
                <TableHead className='hidden md:table-cell text-xs sm:text-sm w-[15%]'>Kode</TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm w-[15%]'>Kategori</TableHead>
                <TableHead className='hidden xl:table-cell text-xs sm:text-sm w-[20%]'>Parent Unit</TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm w-[12%]'>Dibuat</TableHead>
                <TableHead className='text-center text-xs sm:text-sm w-20 sm:w-auto'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchQuery
                      ? 'Tidak ada unit yang sesuai dengan pencarian'
                      : 'Belum ada unit'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className='hidden sm:table-cell text-center text-xs sm:text-sm py-2 sm:py-3'>
                      {unit.id}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
                      <div>{unit.name}</div>
                      <div className='md:hidden text-[10px] text-gray-500 mt-0.5'>
                        <code className='bg-gray-100 px-1 py-0.5 rounded text-[10px]'>
                          {unit.code}
                        </code>
                      </div>
                      <div className='lg:hidden mt-1'>
                        {getCategoryBadge(unit.category)}
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                        {unit.code}
                      </code>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {getCategoryBadge(unit.category)}
                    </TableCell>
                    <TableCell className='hidden xl:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {unit.parent?.name || '-'}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {new Date(unit.created_at).toLocaleDateString('id-ID', {
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
                          onClick={() => handleDetail(unit)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(unit)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(unit)}
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

      {/* Create Unit Modal */}
      <FormDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title='Tambah unit'
        description='Lengkapi data unit baru.'
        size='md'
        onSubmit={handleSubmitCreate}
        submitLabel='Tambah'
        isSubmitting={isSubmitting}
        error={formError}
      >
        {renderUnitFields(false)}
      </FormDialog>

      {/* Edit Unit Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title='Edit unit'
        description={selectedUnit ? `${selectedUnit.code} · ${selectedUnit.name}` : undefined}
        size='md'
        onSubmit={handleSubmitEdit}
        isSubmitting={isSubmitting}
        error={formError}
      >
        {renderUnitFields(true)}
      </FormDialog>

      {/* Detail Unit Modal */}
      <FormDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        title='Detail unit'
        description={selectedUnit?.name}
        size='md'
        footer={<Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>}
      >
        {selectedUnit && (
          <div className='space-y-4'>
            <DetailGrid
              items={[
                ['Kode', <code className='rounded bg-muted px-1.5 py-0.5 text-[13px]'>{selectedUnit.code}</code>],
                ['Kategori', getCategoryBadge(selectedUnit.category)],
                ['Unit induk', selectedUnit.parent ? `${selectedUnit.parent.name} (${selectedUnit.parent.code})` : null, true],
                ['Deskripsi', selectedUnit.description, true],
                ['Dibuat', new Date(selectedUnit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })],
                ['Diperbarui', new Date(selectedUnit.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })],
              ]}
            />
            {selectedUnit.children && selectedUnit.children.length > 0 && (
              <div className='border-t border-black/[0.06] pt-4'>
                <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                  Sub-unit ({selectedUnit.children.length})
                </h3>
                <div className='flex flex-wrap gap-1.5'>
                  {selectedUnit.children.map((child) => (
                    <span key={child.id} className='rounded-full bg-muted px-2.5 py-1 text-xs font-medium'>
                      {child.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className='border-t border-black/[0.06] pt-4'>
              <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                Pengguna di unit ini{unitUsers.length > 0 ? ` (${unitUsers.length})` : ''}
              </h3>
              {isLoadingUsers ? (
                <p className='text-[13px] text-muted-foreground'>Memuat…</p>
              ) : unitUsers.length > 0 ? (
                <ul className='divide-y divide-black/[0.05] overflow-hidden rounded-xl bg-muted/60'>
                  {unitUsers.map((user) => (
                    <li key={user.id} className='flex min-w-0 items-center justify-between gap-3 px-3 py-2'>
                      <span className='truncate text-[13px] font-medium'>{user.name}</span>
                      <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-[13px] text-muted-foreground'>Belum ada pengguna.</p>
              )}
            </div>
          </div>
        )}
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus unit{' '}
              <strong>{selectedUnit?.name}</strong>? Tindakan ini tidak dapat
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
