import { create } from "zustand";
import * as go from "gojs";
import { City } from "../types/gojs-types";

interface DiagramState {
  diagram: go.Diagram | null;
  selectedCity: City | null;
  selectedLink: go.Link | null;
  setDiagram: (diagram: go.Diagram | null) => void;
  setSelectedCity: (city: City | null) => void;
  setSelectedLink: (link: go.Link | null) => void;
  clearSelections: () => void;
  cleanup: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagram: null,
  selectedCity: null,
  selectedLink: null,
  setDiagram: (diagram) => set({ diagram }),
  setSelectedCity: (city) => {
    if (city) {
      const newState = { selectedCity: city, selectedLink: null };
      set(newState);
    } else {
      set({ selectedCity: null, selectedLink: null });
    }
  },
  setSelectedLink: (link) => set({ selectedLink: link, selectedCity: null }),
  clearSelections: () => set({ selectedCity: null, selectedLink: null }),
  cleanup: () => {
    const { diagram } = get();
    if (diagram) {
      diagram.clear();
      diagram.model = new go.GraphLinksModel();
      diagram.div = null;
    }
    set({ diagram: null, selectedCity: null, selectedLink: null });
  },
}));
