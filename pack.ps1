$distFolder = "dist"

Remove-Item -Path "$distFolder\*" -Recurse -Force

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Exiting script."
    exit $LASTEXITCODE
}

if (-Not (Test-Path -Path $distFolder)) {
    Write-Error "The folder 'dist' does not exist. Exiting script."
    exit 1
}

Copy-Item -Path "package.json" -Destination $distFolder -Force

Set-Location -Path $distFolder

npm pack

if ($LASTEXITCODE -ne 0) {
    Write-Error "npm pack failed. Exiting script."
    exit $LASTEXITCODE
}

Set-Location -Path ..

Write-Output "Build and packaging completed successfully."
