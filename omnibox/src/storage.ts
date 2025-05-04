/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference types="npm:@types/chrome" />
/// <reference types="./types/re_expand.d.ts" />

import { default as Generator } from "re_expand";

export interface Suggest {
  descriptions: [string, ...string[]];
  command: string;
}

export async function setData(suggests: Iterable<Suggest>) {
  const items = {} as Record<string, [string, ...string[]]>;
  for (const { command, descriptions } of suggests) {
    items[command] = [
      ...(items[command] ?? []),
      ...descriptions.flatMap((description) =>
        expand(description.replace(/[\[\]]/g, "")).filter((description) =>
          description !== ""
        )
      ),
    ];
  }

  // 既に存在するデータとmergeする
  for (
    const [command, descriptions] of Object.entries(
      await getData(Object.keys(items)),
    )
  ) {
    items[command] = [...descriptions, ...items[command]];
  }

  await chrome.storage.local.set(items);
}

export async function getData(
  commands: string[] | null,
) {
  const values = await chrome.storage.local.get(commands);
  return values as Record<string, [string, ...string[]]>;
}

function expand(pattern: string) {
  const generator = new Generator(pattern);
  try {
    // " "はワイルドカード
    return [
      ...new Set(
        generator.filter(" ").flatMap((pairs) =>
          pairs.map(([expanded]) => expanded)
        ),
      ),
    ];
  } catch (e: unknown) {
    // TypeErrorがでたpatternは無視する
    if (e instanceof TypeError) return [];
    throw e;
  }
}
