/**
 * The value when it is one of the values, otherwise the default. A page that removes an attribute
 * leaves `null`, and a property can receive any value, so an enumerated setting falls back to its
 * default instead of dropping its styles or changing native behaviour.
 */
export function oneOf<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return values.find((candidate) => candidate === value) ?? fallback;
}
