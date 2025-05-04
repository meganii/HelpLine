import { browser } from "../deps/webextension.ts";

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
