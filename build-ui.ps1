$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "frontend"
$backendStaticDir = Join-Path $root "backend\src\main\resources\static"
$distDir = Join-Path $frontendDir "dist"

Write-Host "Building frontend..."
Push-Location $frontendDir
try {
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

if (-not (Test-Path $distDir)) {
  throw "Frontend build output not found at $distDir"
}

Write-Host "Syncing dist to backend static resources..."
New-Item -ItemType Directory -Force -Path $backendStaticDir | Out-Null

Get-ChildItem -LiteralPath $backendStaticDir -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $distDir "*") -Destination $backendStaticDir -Recurse -Force

Write-Host "Building backend JAR..."
Push-Location (Join-Path $root "backend")
try {
  .\mvnw.cmd -DskipTests package
  if ($LASTEXITCODE -ne 0) {
    throw "Backend build failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

Write-Host "Done. Backend JAR is available under backend/target/"
