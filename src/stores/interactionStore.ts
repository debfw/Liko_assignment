import { create } from 'zustand';

interface InteractionState {
  isDraggingEnabled: boolean;
  isLinkingEnabled: boolean;
  isRelinkingEnabled: boolean;
  isResizing: boolean;
  resizeTarget: any | null;
  resizeMouseStartX: number;
  setDraggingEnabled: (enabled: boolean) => void;
  setLinkingEnabled: (enabled: boolean) => void;
  setRelinkingEnabled: (enabled: boolean) => void;
  startResize: (target: any, mouseX: number) => void;
  stopResize: () => void;
  resetInteractions: () => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  isDraggingEnabled: false,
  isLinkingEnabled: false,
  isRelinkingEnabled: false,
  isResizing: false,
  resizeTarget: null,
  resizeMouseStartX: 0,
  setDraggingEnabled: (enabled) => set({ isDraggingEnabled: enabled }),
  setLinkingEnabled: (enabled) => set({ isLinkingEnabled: enabled }),
  setRelinkingEnabled: (enabled) => set({ isRelinkingEnabled: enabled }),
  startResize: (target, mouseX) => set({
    isResizing: true,
    resizeTarget: target,
    resizeMouseStartX: mouseX,
  }),
  stopResize: () => set({
    isResizing: false,
    resizeTarget: null,
    resizeMouseStartX: 0,
  }),
  resetInteractions: () => set({
    isDraggingEnabled: false,
    isLinkingEnabled: false,
    isRelinkingEnabled: false,
    isResizing: false,
    resizeTarget: null,
    resizeMouseStartX: 0,
  }),
}));