// zipファイルを作る
// chromeとfirefoxとで違うmanifest.jsonを作る必要があるので、build scriptにした
/// <reference lib="deno.unstable" />
import { parse } from "https://deno.land/std@0.126.0/flags/mod.ts";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const contentScriptName = "content_script.js";
const backgroundName = "background.js";
const setting = {
  js: "setting.js",
  html: "setting.html",
};
const icons = {
  16: "helpline-16.png",
  32: "helpline-32.png",
  48: "helpline-48.png",
  96: "helpline-96.png",
  128: "helpline-128.png",
  192: "helpline-192.png",
};
const name = "HelpLine";
const manifest: Record<string, unknown> = {
  manifest_version: 2,
  name,
  version: "1.14",

  description: "'/ ' をomniboxに入力してHelpfeel検索する",
  homepage_url: "https://scrapbox.io/HelpLine/OmniHelp",
  icons,

  permissions: [
    "storage",
    "downloads",
    "*://goquick.org/*",
  ],

  omnibox: { keyword: "/" },
  browser_action: {
    default_icon: {
      16: icons[16],
    },
    default_title: "Helpfeel登録",
  },

  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: [
        contentScriptName,
      ],
      run_at: "document_idle",
    },
  ],
  background: {
    scripts: [
      backgroundName,
    ],
    persistent: false,
  },

  options_ui: {
    page: setting.html,
    open_in_tab: true,
  },
};

if (import.meta.main) {
  const isFirefox = parse(Deno.args).firefox === true;
  if (isFirefox) {
    manifest.browser_specific_settings = {
      gecko: {
        id: "addon@example.com",
      },
    };
  }

  const zip = new JSZip();

  // create js files
  await Promise.all(
    ([
      [contentScriptName, new URL("./content_script.ts", import.meta.url)],
      [backgroundName, new URL("./background.ts", import.meta.url)],
      [setting.js, new URL("./setting.ts", import.meta.url)],
    ] as const)
      .map(
        async ([js, ts]) => {
          const { files } = await Deno.emit(ts, { bundle: "classic" });
          const code = files["deno:///bundle.js"];
          zip.addFile(js, code);
          console.log(js);
        },
      ),
  );

  // zip assets
  await Promise.all(
    [...Object.values(icons), setting.html].map(async (name) => {
      zip.addFile(
        name,
        await Deno.readFile(
          new URL(`./${name}`, import.meta.url),
        ),
      );
      console.log(name);
    }),
  );

  zip.addFile("manifest.json", JSON.stringify(manifest));
  console.log("Add manifiest.json");

  // zip
  await Deno.writeFile(
    `${name.toLowerCase()}.zip`,
    await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    }),
  );
  console.log(`Created ${name.toLowerCase()}.zip`);
}
