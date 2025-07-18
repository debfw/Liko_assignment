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
}

export const useDiagramStore = create<DiagramState>((set) => ({
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
}));
