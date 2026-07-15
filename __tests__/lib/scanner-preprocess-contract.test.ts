import { describe, expect, it } from 'vitest';

import { vectorSearchJson } from '@/lib/scanner/preprocess';

describe('scanner vector contract', () => {
  it('invia il campo vector compatibile con brx-match e non vector_b64', () => {
    const payload = JSON.parse(vectorSearchJson(new Float32Array([0.25, -0.5, 0.75]), 5)) as {
      vector?: number[];
      vector_b64?: string;
      top_k?: number;
    };

    expect(payload.vector).toEqual([0.25, -0.5, 0.75]);
    expect(payload.vector_b64).toBeUndefined();
    expect(payload.top_k).toBe(5);
  });
});
