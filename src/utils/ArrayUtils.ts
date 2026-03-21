export default class ArrayUtils {
  static toRecord<T, TKey extends keyof any>(items: T[], keySelector: (item: T) => TKey): Record<TKey, T>
  static toRecord<TSource, TKey extends keyof any, TResult>(
    items: TSource[],
    keySelector: (item: TSource) => TKey,
    valueSelector: (item: TSource) => TResult,
  ): Record<TKey, TResult>
  static toRecord<TSource, TKey extends keyof any, TResult>(
    items: TSource[],
    keySelector: (item: TSource) => TKey,
    valueSelector?: (item: TSource) => TResult,
  ): Record<TKey, TResult> {
    const record: Partial<Record<TKey, TSource | TResult>> = {}
    for (const item of items) {
      record[keySelector(item)] = valueSelector !== undefined ? valueSelector(item) : item
    }

    return record as Record<TKey, TResult>
  }
}
