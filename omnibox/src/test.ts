import { Generator } from "../deps/re_expand.js";
const g = new Generator("(abc|def)(ghi|jkl)", "I am $1 or $2.");
const [i0, i1, i2] = g.filter(" cn ");
console.log("あいまい度0");
for (const [candidate, command] of i0) {
  console.log(`\t${candidate} => ${command}`);
}
console.log("あいまい度1");
for (const [candidate, command] of i1) {
  console.log(`\t${candidate} => ${command}`);
}
console.log("あいまい度2");
for (const [candidate, command] of i2) {
  console.log(`\t${candidate} => ${command}`);
}
