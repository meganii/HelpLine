//
//  https://developer.chrome.com/extensions/omnibox のサンプルをもとにしている
//

//
// https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/omnibox
// manifest.jsonに "omnibox": { "keyword" : "/" } というエントリを書いておくと、
// '/' と' 'を押したとき onInputChanged でキー入力を取得できるようになる
//
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { Asearch } from "../deps/asearch.ts";
import { browser } from "../deps/webextension.ts";
import { ensureTabId } from "./utils.ts";
import { getData } from "./storage.ts";
import { isURL } from "./isURL.ts";

//
// browserActionボタンを押したときcontent_script.jsにメッセージを送る
//
browser.browserAction.onClicked.addListener(async (tab) => {
  ensureTabId(tab);
  await browser.tabs.sendMessage(tab.id, {
    type: "CLICK_POPUP",
    message: "message",
  });
});

//
// ユーザがomniboxで何か入力したとき呼ばれるもの
//
browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const data = await getData(null);

  const candidates = search(text, data);
  console.log(candidates);
  suggest(candidates);

  // よく使うものはトップに出るようにするとか
  // data.unshift({content: "aaaaa", description: "bbbbb"})
  // 学習させておくのは良いかも
});

function search(
  text: string,
  suggests: Record<string, [string, ...string[]]>,
  limit = 10,
): browser.Omnibox.SuggestResult[] {
  const matches = [[], [], [], []] as [
    [string, string][],
    [string, string][],
    [string, string][],
    [string, string][],
  ];
  const { match } = Asearch(` ${text} `);
  for (const [command, descriptions] of Object.entries(suggests)) {
    // 同じコマンドへのヘルプは、検索文字列に一番マッチするものを1つだけ出す
    const distances = descriptions.map((description) => {
      const result = match(description);
      if (!result.found) return 4 as 0 | 1 | 2 | 3 | 4;
      return result.distance;
    });
    const minDistance = Math.min(...distances) as 0 | 1 | 2 | 3 | 4;
    if (minDistance === 4) continue;

    matches[minDistance].push([
      descriptions[distances.indexOf(minDistance)],
      command,
    ]);
    if (matches[0].length >= limit) break;
  }
  return matches.flat().slice(0, limit).map(([description, content]) => ({
    description,
    content,
  }));
}

//
// ユーザがメニューを選択したとき呼ばれるもの
//
browser.omnibox.onInputEntered.addListener(async (text) => {
  if (isURL(text)) {
    browser.tabs.update({ url: text });
  } else {
    const response = await fetch("https://goquick.org", {
      credentials: "include",
    }); // GoQuick.orgユーザはGoQuick.orgを利用
    const data = await response.text();
    browser.tabs.update({
      url: data.match("GoQuick Login")
        ? `https://google.com/search?q=${text}`
        : `https://goquick.org/${text}`,
    });
  }
});
