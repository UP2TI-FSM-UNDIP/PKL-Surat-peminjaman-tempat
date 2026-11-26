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
      className={`bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] p-4 md:p-5 transition-shadow relative overflow-hidden flex flex-col justify-between h-full min-h-[96px] ${onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_rgb(0_0_0/0.06)]' : ''}`}
      onClick={onClick}
    >
      <div className='flex items-start justify-between gap-1 mb-2'>
        <h3 className='text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground leading-none'>
          {value}
        </h3>
        <div
          className={`${bgLight} size-8 rounded-full flex items-center justify-center shrink-0`}
        >
          <Icon className={`${textColor} size-4`} />
        </div>
      </div>
      <p className='text-xs sm:text-[13px] font-medium text-muted-foreground leading-snug line-clamp-2 mt-auto'>{title}</p>
    </div>
  );
}
