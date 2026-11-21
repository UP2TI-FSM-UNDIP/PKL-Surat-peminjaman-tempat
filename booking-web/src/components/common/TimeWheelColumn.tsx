import {
  useCallback,
  useLayoutEffect,
  useRef,
  useId,
} from 'react';

import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;

type TimeWheelColumnProps = {
  label: string;
  values: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Satu kolom wheel dengan scroll-snap. Nilai baru dikirim setelah scroll
 * berhenti sebentar supaya handler form tidak dipanggil tiap piksel.
 */
export function TimeWheelColumn({
  label,
  values,
  value,
  onChange,
}: TimeWheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const commitTimer = useRef<ReturnType<typeof window.setTimeout> | undefined>(
    undefined,
  );
  const suppressScrollRef = useRef(false);
  const listId = useId();
  const activeIndex = Math.max(0, values.indexOf(value));

  const scrollToIndex = useCallback((index: number, smooth = false) => {
    listRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    });
  }, []);

  const commit = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)),
    );

    if (index !== activeIndex) {
      suppressScrollRef.current = true;
      onChange(values[index]);
    }
  }, [activeIndex, onChange, values]);

  const flush = useCallback(() => {
    window.clearTimeout(commitTimer.current);
    commit();
  }, [commit]);

  useLayoutEffect(() => {
    if (suppressScrollRef.current) {
      suppressScrollRef.current = false;
      return;
    }

    scrollToIndex(activeIndex);
  }, [activeIndex, scrollToIndex]);

  const handleScroll = () => {
    window.clearTimeout(commitTimer.current);
    commitTimer.current = window.setTimeout(commit, 80);
  };

  const choose = (index: number) => {
    const next = Math.min(values.length - 1, Math.max(0, index));

    if (next !== activeIndex) {
      suppressScrollRef.current = true;
      onChange(values[next]);
    }
    scrollToIndex(next, true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next = activeIndex;

    if (event.key === 'ArrowDown') next += 1;
    else if (event.key === 'ArrowUp') next -= 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = values.length - 1;
    else return;

    event.preventDefault();
    choose(next);
  };

  return (
    <div className='min-w-0 flex-1'>
      <p className='mb-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <div className='relative'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-0 top-1/2 z-10 h-9 -translate-y-1/2 rounded-md border border-primary/20 bg-primary/10'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-linear-to-b from-popover to-transparent'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-linear-to-t from-popover to-transparent'
        />
        <div
          ref={listRef}
          id={listId}
          role='listbox'
          aria-label={label}
          aria-activedescendant={`${listId}-${values[activeIndex]}`}
          tabIndex={0}
          onScroll={handleScroll}
          onPointerUp={flush}
          onTouchEnd={flush}
          onKeyDown={handleKeyDown}
          className='scrollbar-none relative h-[180px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        >
          <div
            aria-hidden='true'
            style={{ height: ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT }}
          />
          {values.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={item}
                id={`${listId}-${item}`}
                role='option'
                aria-selected={isActive}
                onClick={() => choose(index)}
                style={{ height: ITEM_HEIGHT }}
                className={cn(
                  'flex snap-center items-center justify-center text-sm tabular-nums transition-opacity duration-150',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground opacity-60',
                )}
              >
                {item}
              </div>
            );
          })}
          <div
            aria-hidden='true'
            style={{ height: ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT }}
          />
        </div>
      </div>
    </div>
  );
}
