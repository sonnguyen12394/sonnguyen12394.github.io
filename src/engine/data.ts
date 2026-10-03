// Dữ liệu engine: danh mục mục tiêu (đóng vào mô-đun để màn chọn mở ngay) + đồ thị đầy đủ (tệp data/engine/graph.<băm>.json, tải khi cần).

import meta from './gen/meta.json';
import type { Goal, GoalKind, Graph } from './types.ts';
import { index, type Index } from './graph.ts';

export interface GoalMeta { id: string; kind: GoalKind; vi: string; target: string; cefr: string | null; version: string; n: number }
export const META = meta as { file: string; nodes: number; edges: number; goals: GoalMeta[] };
export const GOALS: Map<string, GoalMeta> = new Map(META.goals.map(g => [g.id, g]));

let graph: Graph | null = null, ix: Index | null = null, p: Promise<Index> | null = null;

export function loaded(): Index | null { return ix; }

export function loadGraph(fetchJson: (url: string) => Promise<unknown>): Promise<Index> {
  if (ix) return Promise.resolve(ix);
  return (p ||= fetchJson(META.file).then(d => { graph = d as Graph; ix = index(graph); return ix; }).finally(() => { p = null; }));
}

export function goalOf(id: string): Goal | undefined { return ix?.goal.get(id); }
