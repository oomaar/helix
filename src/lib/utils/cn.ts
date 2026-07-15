/**
 * Merge Tailwind class strings while dropping falsy values.
 * Small, dependency-free replacement for `clsx`.
 */
export function cn(
  ...args: Array<string | number | null | false | undefined>
): string {
  return args.filter(Boolean).join(" ");
}
