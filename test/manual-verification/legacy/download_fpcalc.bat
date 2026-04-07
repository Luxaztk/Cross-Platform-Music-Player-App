@echo off
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/acoustid/chromaprint/releases/download/v1.6.0/chromaprint-fpcalc-1.6.0-windows-x86_64.zip' -OutFile 'fpcalc.zip'"
powershell -Command "Expand-Archive -Path 'fpcalc.zip' -DestinationPath 'fpcalc_temp' -Force"
if not exist "apps\desktop\electron\bin" mkdir "apps\desktop\electron\bin"
move "fpcalc_temp\chromaprint-fpcalc-1.6.0-windows-x86_64\fpcalc.exe" "apps\desktop\electron\bin\fpcalc.exe"
del fpcalc.zip
rmdir /s /q fpcalc_temp
echo Done.
