import { create } from 'zustand';

interface UIControlsState {
  showLinks: boolean;
  linkOpacity: number;
  selectedNodeSize: number;
  selectedLinkThickness: number;
  toggleLinks: () => void;
  setShowLinks: (show: boolean) => void;
  setLinkOpacity: (opacity: number) => void;
  setSelectedNodeSize: (size: number) => void;
  setSelectedLinkThickness: (thickness: number) => void;
  resetControls: () => void;
}

export const useUIControlsStore = create<UIControlsState>((set) => ({
  showLinks: true,
  linkOpacity: 0.7,
  selectedNodeSize: 1,
  selectedLinkThickness: 3,
  toggleLinks: () => set((state) => ({ showLinks: !state.showLinks })),
  setShowLinks: (show) => set({ showLinks: show }),
  setLinkOpacity: (opacity) => set({ linkOpacity: opacity }),
  setSelectedNodeSize: (size) => set({ selectedNodeSize: size }),
  setSelectedLinkThickness: (thickness) => set({ selectedLinkThickness: thickness }),
  resetControls: () => set({
    showLinks: true,
    linkOpacity: 0.7,
    selectedNodeSize: 1,
    selectedLinkThickness: 3,
  }),
}));