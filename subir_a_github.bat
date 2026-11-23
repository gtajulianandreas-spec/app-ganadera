@echo off
chcp 65001 >nul
echo ========================================================
echo   🐮 APP GANADERA - Asistente para Subir a GitHub
echo ========================================================
echo.
echo Este script conectará tu proyecto local con tu repositorio en GitHub.
echo.
echo PASO PREVIO:
echo 1. Abre https://github.com/new en tu navegador.
echo 2. Crea un repositorio nuevo (ej. "app-ganadera").
echo 3. Copia la URL del repositorio (HTTPS).
echo.
set /p REPO_URL="Pega aquí la URL de tu repositorio GitHub: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] No ingresaste ninguna URL. Operación cancelada.
    pause
    exit /b 1
)

echo.
echo [1/3] Configurando rama principal (main)...
git branch -M main

echo [2/3] Vinculando repositorio remoto origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [3/3] Subiendo código a GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ ¡PROYECTO SUBIDO CON ÉXITO A GITHUB!
    echo ========================================================
    echo.
    echo Ahora solo ve a https://vercel.com :
    echo 1. Inicia sesión con GitHub.
    echo 2. Haz clic en "Add New..." -> "Project".
    echo 3. Selecciona tu repositorio y haz clic en "Deploy".
    echo.
    echo Vercel creará tu enlace permanente en 30 segundos.
) else (
    echo.
    echo [AVISO] Si GitHub te pidió iniciar sesión, autoriza en la ventana emergente y vuelve a intentar.
)

echo.
pause
