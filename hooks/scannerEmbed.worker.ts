/// <reference lib="webworker" />

/**
 * ONNX embed worker — keeps WASM inference off the main thread (smooth camera UI).
 */
import * as ort from 'onnxruntime-web';

const ONNX_SIZE = 224;
const VECTOR_DIM = 384;

type WorkerIn =
  | { type: 'init'; model: ArrayBuffer; wasmBase: string; useWebGl: boolean }
  | { type: 'embed'; tensor: Float32Array };

type WorkerOut =
  | { type: 'ready' }
  | { type: 'vector'; vector: Float32Array }
  | { type: 'error'; message: string };

let session: ort.InferenceSession | null = null;

function post(out: WorkerOut, transfer?: Transferable[]) {
  if (transfer?.length) {
    self.postMessage(out, transfer);
  } else {
    self.postMessage(out);
  }
}

function l2Normalize(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm < 1e-8) return vec;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

async function initSession(model: ArrayBuffer, wasmBase: string, useWebGl: boolean) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.wasmPaths = wasmBase.endsWith('/') ? wasmBase : `${wasmBase}/`;

  const providers: ort.InferenceSession.SessionOptions['executionProviders'] = useWebGl
    ? ['webgl', 'wasm']
    : ['wasm'];

  try {
    session = await ort.InferenceSession.create(model, {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
    });
  } catch {
    session = await ort.InferenceSession.create(model, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }

  const warmup = new ort.Tensor(
    'float32',
    new Float32Array(3 * ONNX_SIZE * ONNX_SIZE),
    [1, 3, ONNX_SIZE, ONNX_SIZE],
  );
  await session.run({ [session.inputNames[0]]: warmup });
}

self.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  const msg = ev.data;
  try {
    if (msg.type === 'init') {
      await initSession(msg.model, msg.wasmBase, msg.useWebGl);
      post({ type: 'ready' });
      return;
    }

    if (msg.type === 'embed') {
      if (!session) throw new Error('ONNX session not initialized');
      const tensor = new ort.Tensor('float32', msg.tensor, [1, 3, ONNX_SIZE, ONNX_SIZE]);
      const outputs = await session.run({ [session.inputNames[0]]: tensor });
      const raw = outputs[session.outputNames[0]].data as Float32Array;
      const cls = new Float32Array(raw.buffer, raw.byteOffset, VECTOR_DIM);
      const vector = l2Normalize(new Float32Array(cls));
      post({ type: 'vector', vector }, [vector.buffer]);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  }
};

export {};
