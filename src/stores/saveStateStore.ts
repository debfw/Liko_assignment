import { create } from "zustand";

interface SaveState {
  status: "saved" | "saving";
  setSaving: () => void;
  setSaved: () => void;
  triggerSave: () => void;
}

//Set to saving immediately when on change and set to saved after 5 sec
export const useSaveStateStore = create<SaveState>((set) => ({
  status: "saved",

  setSaving: () => set({ status: "saving" }),

  setSaved: () => set({ status: "saved" }),

  triggerSave: () => {
    set({ status: "saving" });
    setTimeout(() => {
      set({ status: "saved" });
    }, 5000);
  },
}));
