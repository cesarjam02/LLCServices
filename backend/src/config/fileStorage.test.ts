import { describe, expect, it } from 'vitest';
import { validateFileContent } from './fileStorage.js';

describe('contenido de adjuntos', () => {
  it('rechaza archivos vacíos o ejecutables disfrazados de PDF', () => {
    expect(() => validateFileContent(Buffer.alloc(0), 'application/pdf')).toThrow();
    expect(() => validateFileContent(Buffer.from('MZ executable'), 'application/pdf')).toThrow();
    expect(() =>
      validateFileContent(Buffer.from('<script>alert(1)</script>'), 'image/png'),
    ).toThrow();
  });

  it('acepta las firmas de PDF, JPG y PNG', () => {
    expect(() => validateFileContent(Buffer.from('%PDF-1.7\n'), 'application/pdf')).not.toThrow();
    expect(() =>
      validateFileContent(Buffer.from([255, 216, 255, 224]), 'image/jpeg'),
    ).not.toThrow();
    expect(() =>
      validateFileContent(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'),
    ).not.toThrow();
  });
});
