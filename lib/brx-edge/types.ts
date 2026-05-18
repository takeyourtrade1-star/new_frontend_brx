/** 384-d L2-normalized embedding from DINOv2-small (V2 index). */
export type BrxEmbedding = Float32Array;

export interface BrxVectorSearchRequest {
  embedding: number[];
  top_k?: number;
}

export interface BrxVectorSearchHit {
  scryfall_id: string;
  card_name: string;
  set_code: string;
  score: number;
}

export interface BrxVectorSearchResponse {
  hits: BrxVectorSearchHit[];
  latency_ms: number;
}

export interface BrxModelCacheEntry {
  url: string;
  byteLength: number;
  cachedAt: number;
}
