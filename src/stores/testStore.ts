import { create } from "zustand";

interface TestState {
  testValue: string;
  setTestValue: (value: string) => void;
}

export const useTestStore = create<TestState>((set) => ({
  testValue: "initial",
  setTestValue: (value) => {
    console.log("Setting test value to:", value);
    set({ testValue: value });
  },
}));