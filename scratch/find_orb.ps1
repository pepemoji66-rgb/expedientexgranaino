Add-Type -AssemblyName System.Drawing
$filePath = "c:\Users\Jose Moreno\Desktop\expedientexgranaino_dev\src\assets\atarfe_captura_real.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Check if the pixel has significant green and is relatively bright
        if ($pixel.G -gt 40 -and $pixel.G -gt ($pixel.R + 10) -and $pixel.G -gt ($pixel.B + 10)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$bmp.Dispose()

Write-Host "MinX: $minX, MaxX: $maxX"
Write-Host "MinY: $minY, MaxY: $maxY"
$centerX = [Math]::Round(($minX + $maxX) / 2)
$centerY = [Math]::Round(($minY + $maxY) / 2)
Write-Host "Center: ($centerX, $centerY)"
