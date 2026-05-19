# ONNX model fallback (optional)

Turbo mode downloads `dinov2_small.onnx` (~25 MB) via:

1. `/brx-match/static/dinov2_small.onnx` (requires backend V3 on EC2)
2. `/models/dinov2_small.onnx` (this folder — optional local copy)
3. S3 `ebartex-brx-match-data` (if bucket CORS allows the site origin)

To enable fallback #2 without committing the binary, place the file here at deploy time or symlink from CI. See `DEPLOY_GUIDE_V3.md`.
