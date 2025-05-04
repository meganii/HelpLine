/** URLかどうか判定する */
export function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch (e: unknown) {
    if (e instanceof TypeError) return false;
    throw e;
  }
}
