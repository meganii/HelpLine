/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { setData, Suggest } from "./storage.ts";
import { hasItem } from "./utils.ts";
import { getPage, getPages } from "./fetch.ts";
import { parse } from "../deps/scrapbox-parser.ts";
import { browser } from "../deps/webextension.ts";

function createStatus() {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.width = "100%";
  div.style.height = "18pt";
  div.style.bottom = "0px";
  div.style.left = "0px";
  div.style.backgroundColor = "#ffd";
  div.hidden = true;

  return div;
}
const status = createStatus();
document.body.append(status);

async function register_page(): Promise<Suggest | undefined> {
  const command = location.href;
  const description = window.prompt(`Help説明文を入力`, document.title);

  if (description) {
    return { command, descriptions: [description] };
  }
  if (description === "") { // 空文字列入力
    alert(`ヘルプを消去します (${command})`);
    status.hidden = true;
    await browser.storage.local.remove(command);
  }
  // desc == null (キャンセル)
}

/** Scrapboxページの内容を1行ずつ調べてHelpfeel記法を処理する */
function* process(
  lines: string[],
  project: string,
  glossary?: Map<string, string>,
): Generator<Suggest, void, void> {
  let descriptions = [] as string[]; // Helpfeel記法
  const title = lines[0];
  const blocks = parse(lines.slice(1).join("\n"), { hasTitle: false });
  for (const block of blocks) {
    if (block.type !== "line") continue;

    for (const node of block.nodes) {
      switch (node.type) {
        case "helpfeel": {
          const help = glossary
            ? node.text.replace(
              /{(\w+)}/g,
              (_, p1: string) => glossary.get(p1) ?? `{${p1}}`,
            )
            : node.text;
          descriptions.push(help);
          break;
        }
        case "commandLine": {
          if (!hasItem(descriptions)) {
            alert(`Helpfeel記法が定義されていません - ${title} / ${node.raw}`);
            continue;
          }
          if (node.symbol !== "%") continue;
          const matches = node.text.match(/^\s*(echo|open)\s+(.*)/);
          if (!matches) continue;
          // 前の行までに出てきた全てのhelpfeel記法をこのコマンドと対応付ける
          yield {
            command: matches[2],
            descriptions,
          };
          descriptions = [];
          break;
        }
        default:
          continue;
      }
    }
  }
  if (hasItem(descriptions)) {
    yield {
      command: `https://scrapbox.io/${project}/${title}`,
      descriptions,
    };
  }
}

async function getGlossary(project: string): Promise<Map<string, string>> {
  const text = await getPage(project, "glossary");
  const entries: [string, string][] = text.split("\n").flatMap((line) => {
    const matches = line.match(/^(\w+):(?:`([^`]+)`|(.+))$/);
    if (!matches) return [];
    const word = matches[1];
    const definition = matches[2] ?? matches[3];
    return [[word, definition]];
  });
  return new Map(entries);
}

async function register() {
  const ms = location.href.match(/scrapbox\.io\/([a-zA-Z0-9\-]+)(\/(.*))?$/);
  const mg = location.href.match(/gyazo\.com\/([0-9a-f]{32})/i);
  if (ms?.[1]) {
    // scrapbox.ioにいるとき
    const project = ms[1];
    const encodedTitle = ms[3];
    const glossary = await getGlossary(project);
    if (!encodedTitle) { // ページリスト
      let titles = [] as string[];
      let total = 0;
      let now = 0;

      const flush = async () => {
        await Promise.all(titles.map(async (title) => {
          console.log(title);
          const text = await getPage(project, title);
          now++;
          await setData(function* () {
            for (
              const suggest of process(
                text.split("\n"),
                project,
                glossary,
              )
            ) {
              status.textContent = decodeURIComponent(
                `${now}/${total} ${title} - ${suggest.descriptions[0]}`,
              );

              yield suggest;
            }
          }());
        }));
        titles = [];
      };

      for await (const { count, pages } of getPages(project)) {
        total = count;
        for (const page of pages) {
          titles.push(page.title);

          if (titles.length < 10) continue;
          await flush();
        }
      }
      await flush();

      //
      return;
    }
    // 単独ページ
    const text = await getPage(project, decodeURIComponent(encodedTitle));
    const suggests = [...process(text.split("\n"), project, glossary)];
    if (suggests.length > 0) {
      await setData(suggests);
      return;
    }
    const suggest = await register_page();
    if (!suggest) return;
    await setData([suggest]);
    return;
  }
  if (mg?.[1]) { // GyazoページにHelpfeel記述があれば登録
    // gyazo.comにいるとき
    const gyazoid = mg[1];
    // lines = $('.image-desc-display').text().split(/\n/)
    const display = document.getElementsByClassName("image-desc-display").item(
      0,
    );
    if (display instanceof HTMLElement) {
      const lines = display.innerText.split("\n");
      const descriptions = [] as string[];
      for (const line of lines) {
        if (line.match(/^\?\s/)) { // ? ではじまるHelpfeel記法
          const desc = line.replace(/^\?\s+/, "");
          descriptions.push(line);
          status.textContent = decodeURIComponent(`${desc}`);
        }
      }
      if (hasItem(descriptions)) {
        await setData([{
          command: `https://gyazo.com/${gyazoid}`,
          descriptions,
        }]);
        return;
      }
    }
  }
  // それ以外のサイトにいるとき
  const suggest = await register_page();
  if (!suggest) return;
  await setData([suggest]);
}

//
// コールバックでbackground.jsからの値を受け取る
//
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "CLICK_POPUP") return;

  status.textContent = "";
  status.hidden = false;
  await register();
  status.textContent = "Successfully loaded.";
  setTimeout(() => status.hidden = true, 10000);
});
