import { atom, computed } from "nanostores";

export const atomStatusMessage = atom("");
export const count = atom(0);
export const doubleCount = computed(count, (count) => count * 2);
