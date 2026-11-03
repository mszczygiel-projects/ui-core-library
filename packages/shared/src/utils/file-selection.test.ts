import { describe, expect, it } from 'vitest';

import {
  admitFiles,
  fileExtension,
  fileMeta,
  formatFileSize,
  isSameFile,
  matchesAccept,
  removeAt,
  valueStateOf,
} from './file-selection.ts';

function file(name: string, type = '', size = 10, lastModified = 1) {
  return { name, type, size, lastModified };
}

const png = file('photo.png', 'image/png', 1200);
const svg = file('logo.SVG', 'image/svg+xml', 84);
const pdf = file('report.pdf', 'application/pdf', 3000);

describe('matchesAccept', () => {
  it('accepts every file without a list or a valid entry', () => {
    expect(matchesAccept(pdf, undefined)).toBe(true);
    expect(matchesAccept(pdf, '')).toBe(true);
    expect(matchesAccept(pdf, ' , png')).toBe(true);
  });

  it('matches extensions, wildcards and types without case', () => {
    expect(matchesAccept(svg, '.svg')).toBe(true);
    expect(matchesAccept(png, '.PNG')).toBe(true);
    expect(matchesAccept(png, 'image/*')).toBe(true);
    expect(matchesAccept(png, 'IMAGE/PNG')).toBe(true);
    expect(matchesAccept(pdf, 'image/*, .png')).toBe(false);
    expect(matchesAccept(svg, 'image/png')).toBe(false);
  });

  it('never matches a wildcard on a file whose type is unknown', () => {
    expect(matchesAccept(file('notes'), 'image/*')).toBe(false);
  });
});

describe('admitFiles', () => {
  it('replaces the value without multiple and rejects the rest for their count', () => {
    const result = admitFiles([pdf], [png, svg]);
    expect(result.value).toEqual([png]);
    expect(result.added).toEqual([png]);
    expect(result.rejections).toEqual([{ file: svg, reason: 'count' }]);
  });

  it('appends with multiple and skips a file already chosen without a rejection', () => {
    const copy = file('photo.png', 'image/png', 1200);
    const result = admitFiles([png], [copy, svg], { multiple: true });
    expect(result.value).toEqual([png, svg]);
    expect(result.added).toEqual([svg]);
    expect(result.rejections).toEqual([]);
  });

  it('rejects by type, size and count in that order', () => {
    const result = admitFiles([png], [pdf, file('big.png', 'image/png', 5000), svg], {
      accept: 'image/*',
      maxSize: 2000,
      maxFiles: 1,
      multiple: true,
    });
    expect(result.value).toEqual([png]);
    expect(result.rejections.map(({ reason }) => reason)).toEqual(['type', 'size', 'count']);
  });

  it('keeps the same value when nothing enters it', () => {
    const current = [png];
    expect(admitFiles(current, [pdf], { accept: '.png' }).value).toBe(current);
  });
});

describe('the value', () => {
  it('removes the file at an index', () => {
    expect(removeAt([png, svg, pdf], 1)).toEqual([png, pdf]);
  });

  it('compares files by name, size and modification time', () => {
    expect(isSameFile(png, file('photo.png', 'image/jpeg', 1200))).toBe(true);
    expect(isSameFile(png, file('photo.png', 'image/png', 1200, 2))).toBe(false);
  });

  it('previews one image without multiple, and lists anything else', () => {
    expect(valueStateOf([], false)).toBe('empty');
    expect(valueStateOf([png], false)).toBe('preview');
    expect(valueStateOf([png], true)).toBe('list');
    expect(valueStateOf([pdf], false)).toBe('list');
  });
});

describe('the description of a file', () => {
  it('takes the last extension in capitals', () => {
    expect(fileExtension('archive.tar.gz')).toBe('GZ');
    expect(fileExtension('.env')).toBe('');
    expect(fileExtension('README')).toBe('');
    expect(fileExtension('dot.')).toBe('');
  });

  it('formats sizes in powers of 1000 by locale', () => {
    expect(formatFileSize(0, 'en-US')).toBe('0 byte');
    expect(formatFileSize(512, 'en-US')).toBe('512 byte');
    expect(formatFileSize(84_000, 'en-US')).toBe('84 kB');
    expect(formatFileSize(1_234_567, 'en-US')).toBe('1.2 MB');
    expect(formatFileSize(1_234_567, 'pl-PL')).toBe('1,2 MB');
    expect(formatFileSize(999_960, 'en-US')).toBe('1 MB');
    expect(formatFileSize(5e12, 'en-US')).toBe('5,000 GB');
  });

  it('joins the extension and the size', () => {
    expect(fileMeta(file('a.png', 'image/png', 1_200_000), 'en-US')).toBe('PNG · 1.2 MB');
    expect(fileMeta(file('notes', '', 10), 'en-US')).toBe('10 byte');
  });
});
