/** Kode ruang unik dari slot (maks. 2 ditampilkan, sisanya "+N"). */
export function RoomCodes({ slots }: { slots?: Array<{ room_id: number; room_code?: string | null }> }) {
  const codes = [...new Set((slots ?? []).map((slot) => slot.room_code ?? `#${slot.room_id}`))];
  if (codes.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {codes.slice(0, 2).map((code) => (
        <span key={code} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{code}</span>
      ))}
      {codes.length > 2 && <span className="px-1 text-xs text-muted-foreground">+{codes.length - 2}</span>}
    </div>
  );
}
