/** Pin the achievement card only while the chart is still entirely below the viewport. */
export function shouldPinWhileChartBelow(
  customizerExpanded: boolean,
  chartTop: number,
  viewportBottom: number,
): boolean {
  return customizerExpanded && chartTop >= viewportBottom;
}
