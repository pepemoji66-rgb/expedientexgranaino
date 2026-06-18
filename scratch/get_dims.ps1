Add-Type -AssemblyName System.Drawing
$filePath = "c:\Users\Jose Moreno\Desktop\expedientexgranaino_dev\src\assets\atarfe_captura_real.png"
$img = [System.Drawing.Image]::FromFile($filePath)
Write-Host "Width: $($img.Width)"
Write-Host "Height: $($img.Height)"
$img.Dispose()
