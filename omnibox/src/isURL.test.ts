/// <reference lib="deno.ns" />
import { isURL } from "./isURL.ts";
import { assert } from "../deps/testing.ts";

Deno.test("isURL()", () => {
  assert(isURL("https://example.com"));
  assert(isURL("http://goquick.org"));
  assert(isURL("file:///users/file.txt"));
  assert(isURL("things:///show?id=xxx"));
  assert(!isURL("helpfeel"));
});
