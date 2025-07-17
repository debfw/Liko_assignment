import { create } from 'zustand';
import * as go from 'gojs';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'node' | 'link' | null;
  target: go.Node | go.Link | null;
  showContextMenu: (params: {
    x: number;
    y: number;
    type: 'node' | 'link';
    target: go.Node | go.Link;
  }) => void;
  hideContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  visible: false,
  x: 0,
  y: 0,
  type: null,
  target: null,
  showContextMenu: ({ x, y, type, target }) => set({
    visible: true,
    x,
    y,
    type,
    target,
  }),
  hideContextMenu: () => set({
    visible: false,
    type: null,
    target: null,
  }),
}));