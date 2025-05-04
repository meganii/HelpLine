export type Callback = (a: string[], cmd: string) => void;

export default class {
  public constructor(s?: string, command?: string);

  public add(patter: string, command: string): void;
  public delete(): void;

  /** ルールを解析して状態遷移機械を作成し、`pattern`にマッチするもののリストを返す */
  public filter(
    pattern: string,
    func?: Callback,
    maxAmbig?: 0 | 1 | 2,
  ): [[string, string][], [string, string][], [string, string][]];
}
