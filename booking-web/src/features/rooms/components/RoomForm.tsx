import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROOM_TYPES, type Room, type RoomType } from '@/services/room.service';
import { FileDropZone } from '@/components/common/FileDropZone';
import { Field, FormSection, textareaClass } from '@/components/common/FormDialog';
import type { RoomFormData } from '../utils/roomForm';

interface RoomFormProps {
  formData: RoomFormData;
  setFormData: (data: RoomFormData) => void;
  onFileChange: (file: File | null) => void;
  imageFile?: File | null;
  showStatus?: boolean;
}

/** Isi form ruangan (dipakai di modal tambah & edit). Tombol ada di FormDialog. */
export function RoomForm({ formData, setFormData, onFileChange, imageFile, showStatus = false }: RoomFormProps) {
  const set = (patch: Partial<RoomFormData>) => setFormData({ ...formData, ...patch });

  return (
    <>
      <FormSection title='Identitas ruang'>
        <Field label='Kode ruangan' htmlFor='code' required>
          <Input id='code' value={formData.code} onChange={(e) => set({ code: e.target.value })} placeholder='A101' required />
        </Field>
        <Field label='Nama ruangan' htmlFor='name' required>
          <Input id='name' value={formData.name} onChange={(e) => set({ name: e.target.value })} placeholder='Ruang Kelas A101' required />
        </Field>
        <Field label='Kapasitas' htmlFor='capacity' hint='Kosong = tanpa batas kapasitas.'>
          <Input id='capacity' type='number' min={1} inputMode='numeric' value={formData.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder='Contoh: 40' />
        </Field>
        <Field label='Tipe ruang' htmlFor='room-type'>
          <Select value={formData.type || 'UNSET'} onValueChange={(next) => set({ type: next === 'UNSET' ? '' : (next as RoomType) })}>
            <SelectTrigger id='room-type' className='w-full'>
              <SelectValue placeholder='Pilih tipe ruang' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='UNSET'>Belum ditentukan</SelectItem>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {showStatus && (
          <Field label='Status' htmlFor='status' required wide>
            <Select value={formData.status} onValueChange={(value) => set({ status: value as Room['status'] })}>
              <SelectTrigger id='status' className='w-full'>
                <SelectValue placeholder='Pilih status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ACTIVE'>Aktif</SelectItem>
                <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
                <SelectItem value='INACTIVE'>Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </FormSection>

      <FormSection title='Aturan peminjaman'>
        <label htmlFor='is-bookable-weekday' className='flex cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3 sm:col-span-2'>
          <Checkbox id='is-bookable-weekday' className='mt-0.5' checked={formData.isBookableWeekday} onCheckedChange={(checked) => set({ isBookableWeekday: checked === true })} />
          <span>
            <span className='block text-[13px] font-medium'>Boleh dipinjam Senin–Jumat</span>
            <span className='block text-xs text-muted-foreground'>Sabtu–Minggu selalu menampilkan semua ruang aktif.</span>
          </span>
        </label>
        <Field label='Batas jam hari kerja' htmlFor='weekday-max-end' hint={formData.type === 'STUDIO' ? 'Kosong = 16:30. Studio umumnya 18:00.' : 'Kosong = 16:30.'}>
          <Input id='weekday-max-end' type='time' value={formData.weekdayMaxEndTime} onChange={(e) => set({ weekdayMaxEndTime: e.target.value })} />
        </Field>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Grup sekat' htmlFor='adjacent-group'>
            <Input id='adjacent-group' value={formData.adjacentGroup} onChange={(e) => set({ adjacentGroup: e.target.value })} placeholder='A1-2' />
          </Field>
          <Field label='Posisi' htmlFor='adjacent-position'>
            <Input id='adjacent-position' type='number' min={1} value={formData.adjacentPosition} onChange={(e) => set({ adjacentPosition: e.target.value })} placeholder='1' />
          </Field>
        </div>
      </FormSection>

      <FormSection title='Detail'>
        <Field label='Fasilitas' htmlFor='facilities' hint='Pisahkan dengan koma.'>
          <textarea id='facilities' rows={2} value={formData.facilities} onChange={(e) => set({ facilities: e.target.value })} placeholder='AC, Proyektor, Whiteboard' className={textareaClass} />
        </Field>
        <Field label='Deskripsi / catatan' htmlFor='description'>
          <textarea id='description' rows={2} value={formData.description} onChange={(e) => set({ description: e.target.value })} placeholder='Ruang kelas untuk kuliah umum' className={textareaClass} />
        </Field>
        <Field label={showStatus ? 'Foto ruangan (unggah untuk mengganti)' : 'Foto ruangan'} wide>
          <FileDropZone
            accept='image/*'
            maxSizeMb={5}
            onFile={(file) => onFileChange(file)}
            onClear={() => onFileChange(null)}
            file={imageFile}
            title='Pilih atau seret foto ruangan'
            hint='PNG/JPG, maks. 5 MB'
          />
        </Field>
      </FormSection>
    </>
  );
}
