export const contentFiles = import.meta.glob('/content/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>
