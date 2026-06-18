Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Jose Moreno\.gemini\antigravity\brain\ea932d9a-9675-471c-9450-6bd7ab2e93c8\media__1781201611848.png"
$destPath = "c:\Users\Jose Moreno\Desktop\expedientexgranaino_dev\src\assets\atarfe_captura_real_horizontal.png"

# Load source image
$srcBmp = New-Object System.Drawing.Bitmap($srcPath)

# Target dimensions (16:9 landscape)
$targetWidth = 1920
$targetHeight = 1080

# Create new black bitmap
$destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.Clear([System.Drawing.Color]::Black)

# Crop size and coordinates
# Orb center is (216, 452)
$cropSize = 432 # 216 * 2 (symmetric around X center)
$cropX = 0
$cropY = 452 - 216 # 236

# Create temporary cropped bitmap for pixel processing
$cropBmp = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
$gCrop = [System.Drawing.Graphics]::FromImage($cropBmp)
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropSize, $cropSize)
$gCrop.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()

# Apply radial vignette to the cropped region to blend it into pure black
$centerX = $cropSize / 2
$centerY = $cropSize / 2
$innerRadius = 120 # Start fading after 120 pixels from center
$outerRadius = 216 # Fully black at 216 pixels (edges)

for ($y = 0; $y -lt $cropSize; $y++) {
    for ($x = 0; $x -lt $cropSize; $x++) {
        $dx = $x - $centerX
        $dy = $y - $centerY
        $distance = [Math]::Sqrt($dx*$dx + $dy*$dy)
        
        if ($distance -gt $innerRadius) {
            $pixel = $cropBmp.GetPixel($x, $y)
            if ($distance -ge $outerRadius) {
                # Set to pure black
                $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0))
            } else {
                # Smoothly interpolate to black
                $factor = 1.0 - (($distance - $innerRadius) / ($outerRadius - $innerRadius))
                if ($factor -lt 0) { $factor = 0 }
                if ($factor -gt 1) { $factor = 1 }
                
                $newR = [int]($pixel.R * $factor)
                $newG = [int]($pixel.G * $factor)
                $newB = [int]($pixel.B * $factor)
                
                $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB))
            }
        }
    }
}

# Draw processed cropped image onto the right side of the landscape canvas (offset to avoid text overlap)
$targetX = 1920 - $cropSize - 200 # 200px margin from the right edge
$targetY = [int](($targetHeight - $cropSize) / 2)
$g.DrawImage($cropBmp, $targetX, $targetY)

# Clean up
$g.Dispose()
$cropBmp.Dispose()
$srcBmp.Dispose()

# Save final image
$destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()

Write-Host "Landscape image created successfully at: $destPath"
