import { create } from "zustand";

interface InteractionState {
  isDraggingEnabled: boolean;
  isLinkingEnabled: boolean;
  isRelinkingEnabled: boolean;
  setDraggingEnabled: (enabled: boolean) => void;
  setLinkingEnabled: (enabled: boolean) => void;
  setRelinkingEnabled: (enabled: boolean) => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  isDraggingEnabled: false,
  isLinkingEnabled: false,
  isRelinkingEnabled: false,
  setDraggingEnabled: (enabled) => set({ isDraggingEnabled: enabled }),
  setLinkingEnabled: (enabled) => set({ isLinkingEnabled: enabled }),
  setRelinkingEnabled: (enabled) => set({ isRelinkingEnabled: enabled }),
}));
