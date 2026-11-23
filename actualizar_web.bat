@echo off
chcp 65001 >nul
echo ========================================================
echo   🚀 APP GANADERA - Publicar Actualización a la Web
echo ========================================================
echo.
set /p MENSAJE="Describe brevemente el cambio (ej. Mejora en reportes): "
if "%MENSAJE%"=="" set MENSAJE=Actualización del sistema

echo.
echo [1/3] Compilando y verificando código...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] La compilación falló. Revisa los errores antes de subir.
    pause
    exit /b 1
)

echo.
echo [2/3] Guardando cambios en Git...
"C:\Users\JulianPC\AppData\Local\Programs\Git\cmd\git.exe" add .
"C:\Users\JulianPC\AppData\Local\Programs\Git\cmd\git.exe" commit -m "%MENSAJE%"

echo.
echo [3/3] Enviando a GitHub y Vercel...
"C:\Users\JulianPC\AppData\Local\Programs\Git\cmd\git.exe" push origin main

echo.
echo ========================================================
echo   ✅ ¡ACTUALIZACIÓN ENVIADA CON ÉXITO!
echo ========================================================
echo Vercel detectó los cambios y está actualizando la web en la nube.
echo En ~30 segundos estará disponible para todos los celulares.
echo.
pause
