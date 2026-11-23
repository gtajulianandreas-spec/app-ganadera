# 🐮 APP GANADERA - Asistente para Subir a GitHub en PowerShell
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🐮 APP GANADERA - Subir Repositorio a GitHub" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "PASO PREVIO:" -ForegroundColor Cyan
Write-Host "1. Abre https://github.com/new en tu navegador."
Write-Host "2. Crea un repositorio nuevo (ej. 'app-ganadera')."
Write-Host "3. Copia la URL HTTPS que te da GitHub."
Write-Host ""

$repoUrl = Read-Host "Pega aquí la URL de tu repositorio GitHub"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "`n[ERROR] No ingresaste ninguna URL. Operación cancelada." -ForegroundColor Red
    return
}

Write-Host "`n[1/3] Configurando rama principal 'main'..." -ForegroundColor Yellow
git branch -M main

Write-Host "[2/3] Configurando remoto origin..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl.Trim()

Write-Host "[3/3] Subiendo código a GitHub (git push -u origin main)..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  ✅ ¡PROYECTO SUBIDO CON ÉXITO A GITHUB!" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "`nSiguiente paso en Vercel (1 minuto):" -ForegroundColor Cyan
    Write-Host "1. Entra a https://vercel.com e inicia sesión con tu GitHub."
    Write-Host "2. Haz clic en 'Add New...' -> 'Project'."
    Write-Host "3. Selecciona tu repositorio y haz clic en 'Deploy'."
    Write-Host "4. ¡Listo! Vercel te dará tu enlace permanente https://app-ganadera.vercel.app`n" -ForegroundColor Green
} else {
    Write-Host "`n[AVISO] Si es la primera vez que usas Git con GitHub, completa el inicio de sesión en la ventana emergente y vuelve a ejecutar este script." -ForegroundColor Yellow
}
