$style1 = Get-Content "css\style.css" -Raw -Encoding UTF8
$refStyle = Get-Content "ref_style.css" -Raw -Encoding UTF8

$match = [regex]::Match($refStyle, '(?s)\.logo\s*\{[^}]+\}')
if ($match.Success) {
    $style1 = $style1 -replace '(?s)\.logo\s*\{[^}]+\}', $match.Value
}

$oldGridIndex = $style1.IndexOf("/* ===== FIX PRODUCT GRID ===== */")
if ($oldGridIndex -ge 0) {
    $style1 = $style1.Substring(0, $oldGridIndex)
}

$startProducts = $refStyle.IndexOf("/* ---- Products Section ---- */")
$endFooter = $refStyle.IndexOf("/* ---- Media Queries ---- */")
if ($startProducts -ge 0 -and $endFooter -ge 0) {
    $productsToFooter = $refStyle.Substring($startProducts, $endFooter - $startProducts)
}

$mediaContent = @"
@media(max-width:768px) {
    .product-grid { gap: 20px; }
    .blog-grid { gap: 20px; }
    .contact-container { padding: 25px; }
    .footer { padding: 40px 20px 20px; }
}
"@

$newStyle = $style1 + "`r`n" + $productsToFooter + "`r`n" + $mediaContent
Set-Content "css\style.css" -Value $newStyle -Encoding UTF8

$index1 = Get-Content "index.html" -Raw -Encoding UTF8
$refIndex = Get-Content "ref_index.html" -Raw -Encoding UTF8

$oldIndexHtmlStart = $index1.IndexOf("<!-- ================= NEARBY ================= -->")
$oldIndexEnd = $index1.LastIndexOf("</body>")
if ($oldIndexHtmlStart -ge 0 -and $oldIndexEnd -ge 0) {
    $index1Top = $index1.Substring(0, $oldIndexHtmlStart)
    $index1Bottom = $index1.Substring($oldIndexEnd)
}

$newIndexHtmlStart = $refIndex.IndexOf("<!-- Near You Deals Section -->")
$newIndexEnd = $refIndex.LastIndexOf("</body>")
if ($newIndexHtmlStart -ge 0 -and $newIndexEnd -ge 0) {
    $sectionsHtml = $refIndex.Substring($newIndexHtmlStart, $newIndexEnd - $newIndexHtmlStart)
}

$newIndex = $index1Top + "`r`n" + $sectionsHtml + "`r`n" + $index1Bottom
Set-Content "index.html" -Value $newIndex -Encoding UTF8
