//
// HelpLineの設定画面でデータを扱う
//
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { browser } from "../deps/webextension.ts";
import { getData, setData } from "./storage.ts";

/** chrome.storage のデータをローカルファイルにセーブ */
async function save() {
  const items = await getData(null);

  const data = {} as Record<string, string>;
  for (const [command, descriptions] of Object.entries(items)) {
    for (const description of descriptions) {
      data[description] = command;
    }
  }
  const result = JSON.stringify(data);
  const url = URL.createObjectURL(
    new Blob([result], { type: "application/json" }),
  );
  await browser.downloads.download({
    url: url,
    filename: "helpfeel.json",
  });
}

/** ローカルファイルからデータを読出して chrome.storage にデータを足す */
async function handleFileSelect(evt: { target: HTMLInputElement }) {
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      ({ target }) => {
        const result = target?.result;
        if (typeof result !== "string") {
          reject(TypeError("Mismatch the type of result of FileReader"));
          return;
        }
        resolve(result);
      },
      { once: true },
    );
    const file = evt.target.files?.[0];
    if (!file) {
      reject(Error("No file found"));
      return;
    }
    reader.readAsText(file);
  });

  const data = JSON.parse(text) as Record<string, string>;
  await setData(
    [...Object.entries(data)].map(([description, command]) => ({
      descriptions: [description],
      command,
    })),
  );
}

/** chrome.storage のデータ消去 */
async function clear() {
  await browser.storage.local.clear();
}

document.getElementById("save")?.addEventListener?.("click", save);
getReadDOM().addEventListener(
  "change",
  //@ts-ignore 無視
  handleFileSelect,
);
document.getElementById("clear")?.addEventListener?.("click", clear);

function getReadDOM() {
  const read = document.getElementById("read");
  if (!(read instanceof HTMLInputElement)) {
    throw TypeError("#read must be <input>");
  }
  return read;
}
