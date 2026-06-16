import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vocab } from '../data/vocab';

const BATCH_SIZE = 50;

export const useLearnStore = create(
  persist(
    (set, get) => ({
      learned: {},   // { [wordId]: true }

      markLearned(id) {
        set(s => ({ learned: { ...s.learned, [id]: true } }));
      },

      unmarkLearned(id) {
        set(s => {
          const next = { ...s.learned };
          delete next[id];
          return { learned: next };
        });
      },

      isLearned(id) {
        return !!get().learned[id];
      },

      // How many words are learned in a given batch index
      batchLearnedCount(batchIndex) {
        const slice = vocab.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
        const learned = get().learned;
        return slice.filter(w => learned[w.id]).length;
      },

      totalLearned() {
        return Object.keys(get().learned).length;
      },

      resetAll() {
        set({ learned: {} });
      },
    }),
    { name: 'you-know-learned' }
  )
);
