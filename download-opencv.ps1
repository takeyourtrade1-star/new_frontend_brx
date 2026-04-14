# PowerShell Script to Download OpenCV.js
# Run from project root: .\download-opencv.ps1

$OpenCVVersion = "4.8.0"
$TargetDir = "public\opencv"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "OpenCV.js Downloader for Card Scanner" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Create directory if it doesn't exist
if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir
    Write-Host "Created directory: $TargetDir" -ForegroundColor Green
}

# Download opencv.js
$jsUrl = "https://docs.opencv.org/$OpenCVVersion/opencv.js"
$jsPath = "$TargetDir\opencv.js"

Write-Host "Downloading opencv.js..." -ForegroundColor Yellow -NoNewline

try {
    Invoke-WebRequest -Uri $jsUrl -OutFile $jsPath -TimeoutSec 120
    $size = (Get-Item $jsPath).Length / 1MB
    Write-Host " DONE ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Download opencv_js.wasm
$wasmUrl = "https://docs.opencv.org/$OpenCVVersion/opencv_js.wasm"
$wasmPath = "$TargetDir\opencv_js.wasm"

Write-Host "Downloading opencv_js.wasm..." -ForegroundColor Yellow -NoNewline

try {
    Invoke-WebRequest -Uri $wasmUrl -OutFile $wasmPath -TimeoutSec 120
    $size = (Get-Item $wasmPath).Length / 1MB
    Write-Host " DONE ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files location:" -ForegroundColor White
Write-Host "  - $jsPath" -ForegroundColor Gray
Write-Host "  - $wasmPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Run: npm run dev" -ForegroundColor Yellow
Write-Host "  2. Navigate to the scanner page" -ForegroundColor Yellow
Write-Host "  3. Open browser dev tools to verify OpenCV loads" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Add to .gitignore:" -ForegroundColor Magenta
Write-Host "  public/opencv/opencv.js" -ForegroundColor Gray
Write-Host "  public/opencv/opencv_js.wasm" -ForegroundColor Gray
