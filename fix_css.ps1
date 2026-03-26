$css = Get-Content "css\style.css" -Raw

$badContact = ".contact-section {`r`n    padding: 80px 50px;`r`n    display: flex;`r`n    justify-content: center;`r`n    background: linear-gradient(to bottom, #cfc09f 22%, #634f2c 24%, #cfc09f 26%, #ffecb3 40%, #3a2c0f 78%);`r`n    background-clip: text;`r`n    -webkit-background-clip: text;`r`n    -webkit-text-fill-color: transparent;`r`n    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);`r`n}"
$fixedContact = ".contact-section {`r`n    padding: 80px 50px;`r`n    display: flex;`r`n    justify-content: center;`r`n}"

$css = $css.Replace($badContact, $fixedContact)

$badH2 = "-webkit-text-fill-color: transparent;`r`n}"
$fixedH2 = "-webkit-text-fill-color: transparent;`r`n    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);`r`n}"
$css = $css.Replace($badH2, $fixedH2)

Set-Content "css\style.css" -Value $css -Encoding UTF8
