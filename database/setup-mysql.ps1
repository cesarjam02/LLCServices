param([string]$MySqlBin = 'C:\xampp\mysql\bin', [string]$AdminUser = 'root', [switch]$AskPassword)
$ErrorActionPreference = 'Stop'
$mysql = Join-Path $MySqlBin 'mysql.exe'
if (-not (Test-Path -LiteralPath $mysql)) { throw "No se encontró mysql.exe en $MySqlBin" }
$argsList = @('--host=127.0.0.1', "--user=$AdminUser", '--default-character-set=utf8mb4')
if ($AskPassword) { $argsList += '--password' }
$sqlFile = (Join-Path $PSScriptRoot 'create-database.sql').Replace('\', '/')
& $mysql @argsList "--execute=source $sqlFile"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar MySQL. Inicia MySQL en XAMPP y revisa las credenciales.' }
Push-Location (Join-Path $PSScriptRoot '..')
try {
  npm run db:setup -w backend
  if ($LASTEXITCODE -ne 0) { throw 'Falló la preparación de Prisma.' }
} finally { Pop-Location }
