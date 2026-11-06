import { useLayoutEffect, useRef, useState } from 'react';
import type { MorningOverview } from '@hearth/shared';

export interface RoutinePage {
  start: number;
  end: number;
}

/** Natural row sizes, not a task-count breakpoint, decide whether paging is necessary. */
export function fitRoutinePages(
  heights: number[],
  available: number,
  rowGap: number,
  pagerHeight: number,
  sectionGap: number,
): RoutinePage[] {
  const all = { start: 0, end: heights.length };
  const naturalHeight =
    heights.reduce((sum, height) => sum + height, 0) + Math.max(0, heights.length - 1) * rowGap;
  if (naturalHeight <= available + 0.5) return [all];
  const budget = Math.max(0, available - pagerHeight - sectionGap);
  const pages: RoutinePage[] = [];
  let start = 0;
  let used = 0;
  for (let index = 0; index < heights.length; index++) {
    const next = heights[index]! + (index > start ? rowGap : 0);
    if (index > start && used + next > budget + 0.5) {
      pages.push({ start, end: index });
      start = index;
      used = heights[index]!;
    } else used += next;
  }
  pages.push({ start, end: heights.length });
  return pages;
}

export function useRoutinePagination(
  steps: MorningOverview['people'][number]['steps'],
  enabled: boolean,
) {
  const cardRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  // Completion changes don't affect the geometry or require reinstalling observers every clock tick.
  const key = JSON.stringify(steps.map((step) => [step.id, step.title, Boolean(step.chore)]));
  const [measured, setMeasured] = useState<{ key: string; pages: RoutinePage[] } | null>(null);
  useLayoutEffect(() => {
    if (!enabled) return;
    const card = cardRef.current;
    const probe = measureRef.current;
    const list = card?.querySelector<HTMLOListElement>(':scope > .morning-steps');
    const probeList = probe?.querySelector<HTMLOListElement>('.morning-steps');
    const pager = probe?.querySelector<HTMLElement>('.morning-pager');
    if (!card || !probeList || !list || !pager) return;
    let disposed = false;
    let frame = 0;
    const measure = () => {
      if (disposed) return;
      const style = getComputedStyle(card);
      // The 4K shell uses CSS zoom. DOM rectangles include it; computed padding/gaps don't.
      const scale =
        card.getBoundingClientRect().width / (parseFloat(style.width) || card.offsetWidth);
      const available =
        card.getBoundingClientRect().bottom -
        parseFloat(style.borderBottomWidth) * scale -
        parseFloat(style.paddingBottom) * scale -
        list.getBoundingClientRect().top;
      if (available <= 0) return;
      const heights = Array.from(probeList.children, (row) => row.getBoundingClientRect().height);
      const pages = fitRoutinePages(
        heights,
        available,
        (parseFloat(getComputedStyle(probeList).rowGap) || 0) * scale,
        pager.getBoundingClientRect().height,
        (parseFloat(style.rowGap) || 0) * scale,
      );
      setMeasured((previous) =>
        previous?.key === key && JSON.stringify(previous.pages) === JSON.stringify(pages)
          ? previous
          : { key, pages },
      );
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(card);
    observer.observe(probeList);
    observer.observe(pager);
    const header = card.querySelector('.morning-person__header');
    if (header) observer.observe(header);
    void document.fonts.ready.then(schedule);
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [enabled, key]);
  return {
    cardRef,
    measureRef,
    pages: enabled && measured?.key === key ? measured.pages : [{ start: 0, end: steps.length }],
  };
}
