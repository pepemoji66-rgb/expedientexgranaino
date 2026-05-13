@echo off
title EXPEDIENTE X GRANAINO - SISTEMA DE CONTROL
mode con: cols=80 lines=20
color 0A
echo.
echo  #################################################################
echo  #                                                               #
echo  #          🛰️  SISTEMA DE CONTROL: EXPEDIENTE X GRANAINO         #
echo  #                                                               #
echo  #################################################################
echo.
echo  📡 Iniciando comunicaciones con el búnker...
echo.
cd /d "c:\Users\Jose Moreno\Desktop\expedientexgranaino"
npm start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [!] ERROR: No se pudo iniciar el sistema.
    echo      Asegurese de que Node.js esta instalado.
    pause
)
