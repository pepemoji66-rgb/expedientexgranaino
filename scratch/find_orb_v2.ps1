Add-Type -AssemblyName System.Drawing
$filePath = "c:\Users\Jose Moreno\Desktop\expedientexgranaino_dev\src\assets\atarfe_captura_real.png"
$bmp = New-Object System.Drawing.Bitmap($filePath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

# Scan only the top 80% to avoid any camera interface at the bottom
$scanHeight = [int]($bmp.Height * 0.8)

for ($y = 0; $y -lt $scanHeight; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Average brightness
        $brightness = ($pixel.R + $pixel.G + $pixel.B) / 3
        if ($brightness -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$bmp.Dispose()

if ($minX -le $maxX) {
    Write-Host "MinX: $minX, MaxX: $maxX"
    Write-Host "MinY: $minY, MaxY: $maxY"
    $centerX = [Math]::Round(($minX + $maxX) / 2)
    $centerY = [Math]::Round(($minY + $maxY) / 2)
    Write-Host "Center: ($centerX, $centerY)"
} else {
    Write-Host "No bright pixels found!"
}
