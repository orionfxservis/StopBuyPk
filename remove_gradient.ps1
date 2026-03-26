$css = Get-Content "css\style.css" -Raw
$badText = "justify-content: center;`r`n    background: linear-gradient(to bottom, #cfc09f 22%, #634f2c 24%, #cfc09f 26%, #ffecb3 40%, #3a2c0f 78%);`r`n    background-clip: text;`r`n    -webkit-background-clip: text;`r`n    -webkit-text-fill-color: transparent;`r`n    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);"
$goodText = "justify-content: center;"
$css = $css.Replace($badText, $goodText)
Set-Content "css\style.css" -Value $css -Encoding UTF8
