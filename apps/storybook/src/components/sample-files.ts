/** Files for the stories of FileInputField, made in the browser: a story has no file system. */

const PICTURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
  <rect width="320" height="180" fill="#2f6f4f"/>
  <circle cx="250" cy="48" r="22" fill="#f4d35e"/>
  <path d="M0 180 L90 90 L150 140 L220 70 L320 160 L320 180 Z" fill="#1d4532"/>
</svg>`;

function sample(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1_767_225_600_000 });
}

/** One image, which a field without `multiple` previews. */
export const picture = new File([PICTURE], 'team-photo.svg', {
  type: 'image/svg+xml',
  lastModified: 1_767_225_600_000,
});

/** Two documents, which a field lists below its zone. */
export const documents: readonly File[] = [
  sample('match-report.pdf', 'application/pdf', 1_240_000),
  sample('sponsor-logo.png', 'image/png', 84_000),
];
