/** 各アイテムをいちばん低い列へ入れて Pinterest 風に配分 */
export function distributeMasonryColumns<T>(
  items: T[],
  columnCount: number,
  estimateHeight: (item: T) => number
): T[][] {
  if (columnCount <= 1) return [items];

  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  const heights = new Array<number>(columnCount).fill(0);

  for (const item of items) {
    let target = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    columns[target].push(item);
    heights[target] += estimateHeight(item);
  }

  return columns;
}
