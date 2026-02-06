// Simple merge test to mirror server merging logic in app/api/analyze/route.ts
const perImageResults = [
  [
    { item: 'Chair', quantity: 1, volume_per_unit: 0.5, box_2d: [10, 10, 50, 50] }
  ],
  [
    { item: 'chair ', quantity: 2, volume_per_unit: 0.5, box_2d: [12, 12, 52, 52] },
    { item: 'Lamp', quantity: 1, volume_per_unit: 0.2, box_2d: [60, 60, 80, 80] }
  ],
  [
    { item: 'Sofa', quantity: 1, volume_per_unit: 2.5, box_2d: [5,5,40,40] },
    { item: 'Chair', quantity: 1, volume_per_unit: 0.5, box_2d: [11,11,51,51] }
  ]
];

const merged = {};
for (const items of perImageResults) {
  for (const it of items) {
    const name = (it.item || '').toString().trim().toLowerCase();
    if (!name) continue;
    if (!merged[name]) {
      merged[name] = { ...it };
      merged[name].box_2d = it.box_2d ? [it.box_2d] : [];
      merged[name].sources = [{ image: -1, box: it.box_2d }];
    } else {
      merged[name].quantity = (merged[name].quantity || 0) + (it.quantity || 1);
      if (it.box_2d) merged[name].box_2d.push(it.box_2d);
      merged[name].sources.push({ image: -1, box: it.box_2d });
    }
  }
}

const out = { items: Object.values(merged) };
console.log(JSON.stringify(out, null, 2));
