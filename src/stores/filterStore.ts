import { create } from "zustand";
import { GoJSCityNodeData } from "../types/gojs-types";

interface FilterState {
  searchTerm: string;
  selectedShippingMethod: string | null;
  allCities: GoJSCityNodeData[];
  setSearchTerm: (term: string) => void;
  setSelectedShippingMethod: (method: string | null) => void;
  setAllCities: (cities: GoJSCityNodeData[]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchTerm: "",
  selectedShippingMethod: null,
  allCities: [],
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedShippingMethod: (method) =>
    set({ selectedShippingMethod: method }),
  setAllCities: (cities) => set({ allCities: cities }),
  resetFilters: () =>
    set({
      searchTerm: "",
      selectedShippingMethod: null,
    }),
}));
