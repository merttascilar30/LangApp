export const contentFiles = import.meta.glob(['/content/modules.json', '/content/modul-*/*.json'], {
  eager: true,
  import: 'default',
}) as Record<string, unknown>
