param(
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\17\bin"
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$psql = Join-Path $PostgresBin 'psql.exe'

if (-not (Test-Path -LiteralPath $psql)) {
  throw "No se encontró psql.exe en $PostgresBin. Ejecuta el script indicando la carpeta correcta, por ejemplo: .\database\setup-postgres.ps1 -PostgresBin 'C:\Program Files\PostgreSQL\18\bin'"
}

Write-Host '1/3 Creando usuario y base de datos PostgreSQL...' -ForegroundColor Cyan
& $psql -U postgres -h localhost -p 5432 -f (Join-Path $PSScriptRoot 'create-database.sql')
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL no pudo crear la base de datos.' }

Write-Host '2/3 Aplicando tablas y relaciones...' -ForegroundColor Cyan
Push-Location $projectRoot
try {
  npm run db:setup -w backend
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo aplicar el esquema o ejecutar el seed.' }
} finally {
  Pop-Location
}

Write-Host '3/3 Configuración terminada.' -ForegroundColor Green
Write-Host 'Usuario web: superadmin'
Write-Host 'Contraseña web: 1234'
Write-Host 'Ahora ejecuta: npm run dev'
