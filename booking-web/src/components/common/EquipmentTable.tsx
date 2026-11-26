/** Tabel sederhana kebutuhan alat: nomor, nama alat, jumlah. */
export function EquipmentTable({ items }: { items: Array<{ nama: string; jumlah: number | string }> }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-muted-foreground">Tidak ada kebutuhan alat.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-[13px]">
        <thead className="bg-[#f5f5f7] text-left text-muted-foreground">
          <tr>
            <th className="w-10 border-b border-border px-3 py-2 text-center font-medium">#</th>
            <th className="border-b border-border px-3 py-2 font-medium">Nama alat</th>
            <th className="w-20 border-b border-border px-3 py-2 text-right font-medium">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.nama}-${index}`} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 text-center text-muted-foreground">{index + 1}</td>
              <td className="break-words px-3 py-2">{item.nama}</td>
              <td className="px-3 py-2 text-right tabular-nums">{item.jumlah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
