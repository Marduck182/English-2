import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vocab } from '../data/vocab';

const BATCH_SIZE = 50;

export const useLearnStore = create(
  persist(
    (set, get) => ({
      learned:   {},   // { [wordId]: true }
      practiced: {},   // { [wordId]: true } — used by Speak

      // ── Learn ──────────────────────────────────────────────
      markLearned(id) {
        set(s => ({ learned: { ...s.learned, [id]: true } }));
      },
      unmarkLearned(id) {
        set(s => { const n = { ...s.learned }; delete n[id]; return { learned: n }; });
      },
      isLearned: id => !!get().learned[id],

      batchLearnedCount(batchIndex) {
        const slice   = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
        const learned = get().learned;
        return slice.filter(w => learned[w.id]).length;
      },
      totalLearned: () => Object.keys(get().learned).length,

      // ── Speak ──────────────────────────────────────────────
      markPracticed(id) {
        set(s => ({ practiced: { ...s.practiced, [id]: true } }));
      },
      isPracticed: id => !!get().practiced[id],

      batchPracticedCount(batchIndex) {
        const slice     = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
        const practiced = get().practiced;
        return slice.filter(w => practiced[w.id]).length;
      },
      totalPracticed: () => Object.keys(get().practiced).length,

      // ── Utils ─────────────────────────────────────────────
      resetAll() { set({ learned: {}, practiced: {} }); },
    }),
    { name: 'you-know-learned' }
  )
);
