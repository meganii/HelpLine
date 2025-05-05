/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference types="npm:@types/chrome" />

type PickRequired<T, K extends keyof T> =
  & T
  & {
    [P in K]-?: T[P];
  };
export function ensureTabId(
  tab: chrome.tabs.Tab,
): asserts tab is PickRequired<chrome.tabs.Tab, "id"> {
  if (tab.id !== undefined) return;
  throw TypeError("The value must has id.");
}

export function hasItem<T>(list: T[]): list is [T, ...T[]] {
  return list.length > 0;
}
