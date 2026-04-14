OPENCV.JS SETUP - PLACE FILES HERE
====================================

Place the following two files in this directory:

1. opencv.js       (JavaScript file, ~2.5 MB)
2. opencv_js.wasm  (WebAssembly binary, ~7 MB)

DOWNLOAD INSTRUCTIONS:
---------------------
Option 1 - Manual Download:
  1. Visit: https://docs.opencv.org/4.8.0/opencv.js
     Save as: opencv.js
  
  2. Visit: https://docs.opencv.org/4.8.0/opencv_js.wasm
     Save as: opencv_js.wasm

Option 2 - PowerShell (run in project root):
  Invoke-WebRequest -Uri "https://docs.opencv.org/4.8.0/opencv.js" -OutFile "public/opencv/opencv.js"
  Invoke-WebRequest -Uri "https://docs.opencv.org/4.8.0/opencv_js.wasm" -OutFile "public/opencv/opencv_js.wasm"

Option 3 - cURL (if available):
  curl -L https://docs.opencv.org/4.8.0/opencv.js -o public/opencv/opencv.js
  curl -L https://docs.opencv.org/4.8.0/opencv_js.wasm -o public/opencv/opencv_js.wasm

IMPORTANT:
----------
- Both files must be in this exact location: public/opencv/
- The .wasm file MUST keep the name "opencv_js.wasm" (do not rename)
- Do not commit these files to git (large binaries) - add to .gitignore

BUILD OPTIMIZATION (Optional for production):
--------------------------------------------
You can build a custom OpenCV.js with only needed modules:
  - core
  - imgproc
  - imgcodecs

See: https://docs.opencv.org/4.x/d4/da1/tutorial_js_setup.html
