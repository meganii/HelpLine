import { default as browser } from "https://esm.sh/webextension-polyfill@0.8.0";

type PickRequired<T, K extends keyof T> =
  & T
  & {
    [P in K]-?: T[P];
  };
export function ensureTabId(
  tab: browser.Tabs.Tab,
): asserts tab is PickRequired<browser.Tabs.Tab, "id"> {
  if (tab.id !== undefined) return;
  throw TypeError("The value must has id.");
}

export function hasItem<T>(list: T[]): list is [T, ...T[]] {
  return list.length > 0;
}
