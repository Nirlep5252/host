"use client";

import { useState, useEffect, useCallback } from "react";

const BREAKPOINTS = {
  sm: 640,
  lg: 1024,
  xl: 1280,
} as const;

function getColumnCount(width: number): number {
  if (width >= BREAKPOINTS.xl) return 4;
  if (width >= BREAKPOINTS.lg) return 3;
  if (width >= BREAKPOINTS.sm) return 2;
  return 1;
}

/**
 * Reorders items so CSS columns display them in horizontal (left-to-right) order.
 *
 * CSS columns fill vertically (top-to-bottom per column), so we need to redistribute
 * items: indices 0, n, 2n... go to column 1; 1, n+1, 2n+1... go to column 2, etc.
 *
 * @param items - Array of items to reorder
 * @param columnCount - Number of columns in the layout
 * @returns Reordered array that displays horizontally in CSS columns
 */
export function sortForHorizontalFlow<T>(items: T[], columnCount: number): T[] {
  if (columnCount <= 1 || items.length <= 1) return items;

  const result: T[] = [];
  const itemCount = items.length;
  const rowCount = Math.ceil(itemCount / columnCount);

  for (let col = 0; col < columnCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      const originalIndex = row * columnCount + col;
      if (originalIndex < itemCount) {
        result.push(items[originalIndex]);
      }
    }
  }

  return result;
}

/**
 * Hook that provides responsive column count and item reordering for masonry layouts.
 *
 * @returns Object with columnCount and sortForHorizontalFlow function
 */
export function useMasonryOrder() {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    function handleResize() {
      setColumnCount(getColumnCount(window.innerWidth));
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const reorderItems = useCallback(
    <T,>(items: T[]): T[] => sortForHorizontalFlow(items, columnCount),
    [columnCount]
  );

  return { columnCount, reorderItems };
}
