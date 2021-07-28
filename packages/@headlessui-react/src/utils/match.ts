/**
 * 說明與範例
 * lookup 是物件，value 是想要從 lookup 中找的 key
 * 從 lookup 中找出 key 為 value 的
 * 物件值是函式的話，會執行這個函式，並以 match 後多餘的參數當作參數傳入
 * 否則回傳 lookup 物件對應的 value
 *
 * enum GENDER {
 *   MALE,
 *   FEMALE,
 * }
 * const lookup = {
 *   [GENDER.MALE]: 'man',
 *   [GENDER.FEMALE]: 'woman',
 * };
 *
 * const result = match(GENDER.MALE, lookup) // "man"
 **/

export function match<TValue extends string | number = string, TReturnValue = unknown>(
  value: TValue,
  lookup: Record<TValue, TReturnValue | ((...args: any[]) => TReturnValue)>,
  ...args: any[]
): TReturnValue {
  if (value in lookup) {
    let returnValue = lookup[value]
    return typeof returnValue === 'function' ? returnValue(...args) : returnValue
  }

  let error = new Error(
    `Tried to handle "${value}" but there is no handler defined. Only defined handlers are: ${Object.keys(
      lookup
    )
      .map(key => `"${key}"`)
      .join(', ')}.`
  )
  if (Error.captureStackTrace) Error.captureStackTrace(error, match)
  throw error
}
