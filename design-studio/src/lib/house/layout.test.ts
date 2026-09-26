import assert from "node:assert/strict";
import test from "node:test";
import { buildHouse } from "./layout.ts";
import { DEFAULT_SPEC, TEMPLATES, specFromTemplate } from "./templates.ts";
import type { HouseSpec } from "./types.ts";

// Structural rules every generated plan must satisfy, whatever the sliders say.
function check(spec: HouseSpec, tag: string) {
  const m = buildHouse(spec);
  const beds = m.rooms.filter((r) => r.kind === "bedroom" || r.kind === "master").length;
  const baths = m.rooms.filter((r) => r.kind === "bathroom").length;
  assert.equal(beds, m.spec.bedrooms, `${tag}: bedroom count`);
  assert.equal(baths, m.spec.bathrooms, `${tag}: bathroom count`);
  assert.equal(new Set(m.rooms.map((r) => r.id)).size, m.rooms.length, `${tag}: unique ids`);

  for (const floor of [0, 1] as const) {
    const rs = m.rooms.filter((r) => r.floor === floor);
    if (!rs.length) continue;
    const covered = rs.reduce((s, r) => s + r.w * r.l, 0);
    assert.ok(Math.abs(covered - m.envelope.w * m.envelope.l) < m.envelope.w * m.envelope.l * 0.01, `${tag}: floor ${floor} tiles the envelope`);
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i];
        const b = rs[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y);
        assert.ok(!(ox > 0.2 && oy > 0.2), `${tag}: ${a.name} overlaps ${b.name}`);
      }
    }
    // Every room reachable through doors.
    const adj = new Map<string, string[]>();
    for (const o of m.openings) {
      if (o.type !== "door" || !o.connectsTo || o.connectsTo === "exterior") continue;
      adj.set(o.roomId, [...(adj.get(o.roomId) ?? []), o.connectsTo]);
      adj.set(o.connectsTo, [...(adj.get(o.connectsTo) ?? []), o.roomId]);
    }
    const seeds = rs.filter((r) => (floor === 0 ? r.kind === "living" || r.kind === "verandah" : r.kind === "stair" || r.kind === "passage"));
    const seen = new Set(seeds.map((r) => r.id));
    const queue = [...seen];
    while (queue.length) {
      for (const n of adj.get(queue.pop() as string) ?? []) {
        if (seen.has(n)) continue;
        seen.add(n);
        queue.push(n);
      }
    }
    for (const r of rs) assert.ok(seen.has(r.id), `${tag}: ${r.name} has no way in`);
  }
  for (const w of m.walls) {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    for (const o of w.openings) assert.ok(o.offset >= -0.01 && o.offset + o.width <= len + 0.01, `${tag}: ${o.id} fits its wall`);
  }
}

test("every template builds a valid plan", () => {
  for (const t of TEMPLATES) check(specFromTemplate(t.id), t.id);
});

test("plans stay valid across bedrooms, baths, storeys, options and plot sizes", () => {
  for (const bedrooms of [1, 2, 3, 4, 5])
    for (const bathrooms of [1, 2, 3])
      for (const stories of [1, 2] as const)
        for (const includeVerandah of [true, false])
          for (const includePassage of [true, false])
            for (const [plotWidth, plotLength] of [[30, 40], [46, 58], [80, 100]])
              check(
                { ...DEFAULT_SPEC, bedrooms, bathrooms, stories, includeVerandah, includePassage, plotWidth, plotLength },
                `b${bedrooms} ba${bathrooms} s${stories} v${+includeVerandah} p${+includePassage} ${plotWidth}x${plotLength}`,
              );
});

test("a huge plot does not stretch bedrooms into ballrooms", () => {
  const m = buildHouse({ ...DEFAULT_SPEC, bedrooms: 2, bathrooms: 1, stories: 1, plotWidth: 80, plotLength: 100 });
  for (const r of m.rooms.filter((x) => x.kind === "bedroom" || x.kind === "master")) {
    assert.ok(r.w * r.l < 400, `${r.name} is ${Math.round(r.w * r.l)} sq ft`);
  }
});
