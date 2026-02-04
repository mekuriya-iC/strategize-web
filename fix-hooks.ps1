$filePath = "c:\Users\ET\Desktop\Besufkad's file\Work\Dockerized\strategize-web\src\app\dashboard\objectives\[id]\page.tsx"
$lines = Get-Content $filePath

# Find and remove lines 340-382 (duplicate hooks)
$startLine = 339  # 0-indexed, so line 340 in editor
$endLine = 381    # 0-indexed, so line 382 in editor

$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -lt $startLine -or $i -gt $endLine) {
        $newLines += $lines[$i]
    }
}

$newLines | Set-Content -Path $filePath
Write-Host "Removed duplicate hooks (lines 340-382)"