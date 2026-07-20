export function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function arc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const large = end - start > Math.PI ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, start);
  const o2 = polar(cx, cy, rOuter, end);
  const i2 = polar(cx, cy, rInner, end);
  const i1 = polar(cx, cy, rInner, start);
  return [
    `M${o1.x} ${o1.y}`,
    `A${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L${i2.x} ${i2.y}`,
    `A${rInner} ${rInner} 0 ${large} 0 ${i1.x} ${i1.y}`,
    "Z",
  ].join(" ");
}
