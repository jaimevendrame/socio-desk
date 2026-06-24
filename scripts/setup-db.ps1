#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$DockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

Write-Host "Setup do banco de dados..." -ForegroundColor Cyan

Write-Host "Aguardando PostgreSQL..." -ForegroundColor Yellow
$maxRetries = 30
$retry = 0
while ($retry -lt $maxRetries) {
    $result = & $DockerPath exec socio-desk-db pg_isready -U dev 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL pronto!" -ForegroundColor Green
        break
    }
    $retry++
    Start-Sleep -Seconds 1
}

if ($retry -eq $maxRetries) {
    Write-Host "PostgreSQL nao ficou pronto" -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando schema Drizzle..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar schema" -ForegroundColor Red
    exit 1
}
Write-Host "Schema aplicado!" -ForegroundColor Green

Write-Host "Aplicando seed..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar seed" -ForegroundColor Red
    exit 1
}
Write-Host "Seed aplicado!" -ForegroundColor Green

Write-Host "Banco configurado!" -ForegroundColor Green
