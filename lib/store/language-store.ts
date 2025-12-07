import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ar';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      toggleLanguage: () => {
        const current = get().language;
        set({ language: current === 'en' ? 'ar' : 'en' });
      },
    }),
    {
      name: 'language-storage', // localStorage key
    }
  )
);
