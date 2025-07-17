import { create } from "zustand";
import * as go from "gojs";
import { GoJSCityNodeData } from "../types/gojs-types";

interface DiagramState {
  diagram: go.Diagram | null;
  selectedCity: any; // Changed to any to eliminate type issues
  selectedLink: go.Link | null;
  setDiagram: (diagram: go.Diagram | null) => void;
  setSelectedCity: (city: any) => void;
  setSelectedLink: (link: go.Link | null) => void;
  clearSelections: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagram: null,
  selectedCity: null,
  selectedLink: null,
  setDiagram: (diagram) => set({ diagram }),
  setSelectedCity: (city) => {
    console.log("diagramStore setSelectedCity called with:", city);
    console.log("Current state before update:", get());
    console.log("Type of city parameter:", typeof city);
    console.log("Is city null?", city === null);
    console.log("City keys:", city ? Object.keys(city) : "city is null");
    
    // Try different approaches
    if (city) {
      const newState = { selectedCity: city, selectedLink: null };
      console.log("New state to set:", newState);
      set(newState);
    } else {
      set({ selectedCity: null, selectedLink: null });
    }
    
    // Check state immediately after
    setTimeout(() => {
      const currentState = get();
      console.log("State after timeout:", currentState);
      console.log("selectedCity after timeout:", currentState.selectedCity);
    }, 0);
  },
  setSelectedLink: (link) => set({ selectedLink: link, selectedCity: null }),
  clearSelections: () => set({ selectedCity: null, selectedLink: null }),
}));
