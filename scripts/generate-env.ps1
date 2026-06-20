# Generate secrets and JWT API keys for Holy Ranking / Supabase self-hosting.
# Based on https://github.com/supabase/supabase/blob/master/docker/utils/generate-keys.sh
#
# Usage:
#   .\scripts\generate-env.ps1
#   .\scripts\generate-env.ps1 -UpdateEnv

param(
    [switch]$UpdateEnv
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir ".env"

function Get-RandomBase64([int]$ByteCount) {
    $bytes = New-Object byte[] $ByteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes)
}

function Get-RandomHex([int]$ByteCount) {
    $bytes = New-Object byte[] $ByteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

function ConvertTo-Base64Url([byte[]]$Bytes) {
    [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-SupabaseJwt([string]$Secret, [string]$Role) {
    $headerJson = '{"alg":"HS256","typ":"JWT"}'
    $iat = [int][double]::Parse((Get-Date -UFormat %s))
    $exp = $iat + (5 * 3600 * 24 * 365)
    $payloadJson = "{`"role`":`"$Role`",`"iss`":`"supabase`",`"iat`":$iat,`"exp`":$exp}"

    $header = ConvertTo-Base64Url([Text.Encoding]::UTF8.GetBytes($headerJson))
    $payload = ConvertTo-Base64Url([Text.Encoding]::UTF8.GetBytes($payloadJson))
    $signedContent = "$header.$payload"

    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $signature = ConvertTo-Base64Url($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($signedContent)))

    "$signedContent.$signature"
}

$jwtSecret = Get-RandomBase64 30
$anonKey = New-SupabaseJwt -Secret $jwtSecret -Role "anon"
$serviceRoleKey = New-SupabaseJwt -Secret $jwtSecret -Role "service_role"
$pgMetaCryptoKey = Get-RandomBase64 24
$postgresPassword = Get-RandomHex 16
$dashboardPassword = Get-RandomHex 16

Write-Output ""
Write-Output "JWT_SECRET=$jwtSecret"
Write-Output "ANON_KEY=$anonKey"
Write-Output "SERVICE_ROLE_KEY=$serviceRoleKey"
Write-Output "PG_META_CRYPTO_KEY=$pgMetaCryptoKey"
Write-Output "POSTGRES_PASSWORD=$postgresPassword"
Write-Output "DASHBOARD_PASSWORD=$dashboardPassword"
Write-Output ""

if (-not $UpdateEnv) {
    Write-Output "Pass -UpdateEnv to write these values into .env"
    exit 0
}

if (-not (Test-Path $EnvFile)) {
    $ExampleFile = Join-Path $RootDir ".env.example"
    if (Test-Path $ExampleFile) {
        Copy-Item $ExampleFile $EnvFile
        Write-Output "Created .env from .env.example"
    } else {
        throw ".env not found. Copy .env.example to .env first."
    }
}

function Set-EnvValueInFile([string]$Path, [string]$Name, [string]$Value) {
    $pattern = "^\s*$([regex]::Escape($Name))=.*$"
    $replacement = "$Name=$Value"
    $content = Get-Content $Path -Raw
    if ($content -match "(?m)^\s*$([regex]::Escape($Name))=") {
        $content = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    } else {
        $content = $content.TrimEnd() + "`n$replacement`n"
    }
    Set-Content -Path $Path -Value $content -NoNewline
}

function Set-EnvValue([string]$Name, [string]$Value) {
    Set-EnvValueInFile $EnvFile $Name $Value
}

Write-Output "Updating .env..."

Set-EnvValue "JWT_SECRET" $jwtSecret
Set-EnvValue "ANON_KEY" $anonKey
Set-EnvValue "SERVICE_ROLE_KEY" $serviceRoleKey
Set-EnvValue "NEXT_PUBLIC_SUPABASE_ANON_KEY" $anonKey
Set-EnvValue "SUPABASE_SERVICE_ROLE_KEY" $serviceRoleKey
Set-EnvValue "PG_META_CRYPTO_KEY" $pgMetaCryptoKey
Set-EnvValue "POSTGRES_PASSWORD" $postgresPassword
Set-EnvValue "DASHBOARD_PASSWORD" $dashboardPassword
Set-EnvValue "DATABASE_URL" "postgresql://postgres:$postgresPassword@localhost:5432/postgres"

$LocalEnvFile = Join-Path $RootDir ".env.local"
if (Test-Path $LocalEnvFile) {
    Write-Output "Syncing Next.js keys into .env.local..."
    Set-EnvValueInFile $LocalEnvFile "NEXT_PUBLIC_SUPABASE_ANON_KEY" $anonKey
    Set-EnvValueInFile $LocalEnvFile "SUPABASE_SERVICE_ROLE_KEY" $serviceRoleKey
    Set-EnvValueInFile $LocalEnvFile "DATABASE_URL" "postgresql://postgres:$postgresPassword@localhost:5432/postgres"
}

Write-Output "Done. Review .env before starting Docker."
Write-Output "If Docker was already started with an old POSTGRES_PASSWORD, reset the DB volume:"
Write-Output "  docker compose down -v"
Write-Output "  docker compose up -d db auth rest kong meta studio"
