@echo off
TITLE Serveur Principal AMM - Reseau Local Wi-Fi
echo ============================================================
echo   DEMARRAGE DU SERVEUR PRINCIPAL AMM (RESEAU LOCAL WI-FI)
echo ============================================================
echo Ce serveur permet aux ordinateurs Windows et telephones Android
echo de synchroniser leurs donnees sur le reseau local sans Internet.
echo.
echo Port d'ecoute : 4000
echo Code PIN d'appairage par defaut : 123456
echo.
echo Verification de Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe sur cet ordinateur.
    echo Veuillez installer Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

echo Demarrage du service en cours...
npx tsx server/lanServer.ts
pause
