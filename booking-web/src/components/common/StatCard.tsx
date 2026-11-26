import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  textColor: string;
  bgLight: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  textColor,
  bgLight,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow sm:px-4 ${onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_rgb(0_0_0/0.06)]' : ''}`}
      onClick={onClick}
    >
      <div className={`${bgLight} hidden size-9 shrink-0 items-center justify-center rounded-full sm:flex`}>
        <Icon className={`${textColor} size-[18px]`} />
      </div>
      <div className='min-w-0'>
        <p className='truncate text-xs font-medium text-muted-foreground'>{title}</p>
        <h3 className='text-xl font-semibold leading-tight tracking-tight text-foreground'>{value}</h3>
      </div>
    </div>
  );
}
