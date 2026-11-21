import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

/**
 * Filter berbentuk segmen dengan indikator yang bergeser.
 * Indikator diukur dari tombol aktif supaya lebar tiap label bebas.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const index = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    const button = track.querySelectorAll<HTMLButtonElement>('[data-segment]')[
      index
    ];

    if (!button) return;

    const next = { left: button.offsetLeft, width: button.offsetWidth };
    setIndicator((previous) =>
      previous.left === next.left && previous.width === next.width
        ? previous
        : next,
    );
  }, [options, value]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className={cn('max-w-full overflow-x-auto scrollbar-none', className)}>
      <div
        ref={trackRef}
        role='group'
        aria-label={ariaLabel}
        className='relative flex w-max gap-1 rounded-full border border-gray-200 bg-gray-50 p-1'
      >
        <span
          aria-hidden='true'
          className='pointer-events-none absolute inset-y-1 left-0 rounded-full bg-primary shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform'
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type='button'
              data-segment
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative z-10 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
