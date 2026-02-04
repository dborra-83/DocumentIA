# Script de Despliegue Automatizado para Document Analysis
# PowerShell Script para Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Document Analysis - Deployment Script" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un comando existe
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Verificar requisitos previos
Write-Host "[1/7] Verificando requisitos previos..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm no está instalado" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "aws")) {
    Write-Host "❌ AWS CLI no está instalado" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "cdk")) {
    Write-Host "❌ AWS CDK no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g aws-cdk
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando AWS CDK" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Todos los requisitos están instalados" -ForegroundColor Green
Write-Host ""

# Verificar credenciales de AWS
Write-Host "[2/7] Verificando credenciales de AWS..." -ForegroundColor Yellow

try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "✅ AWS User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ No se pudieron verificar las credenciales de AWS" -ForegroundColor Red
    Write-Host "   Ejecuta: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Instalar dependencias
Write-Host "[3/7] Instalando dependencias..." -ForegroundColor Yellow

Push-Location infrastructure

if (-not (Test-Path "node_modules")) {
    Write-Host "   Instalando dependencias de npm..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Compilar TypeScript
if (-not $SkipBuild) {
    Write-Host "[4/7] Compilando código TypeScript..." -ForegroundColor Yellow
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error compilando TypeScript" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "✅ Código compilado exitosamente" -ForegroundColor Green
} else {
    Write-Host "[4/7] Saltando compilación (--SkipBuild)" -ForegroundColor Gray
}
Write-Host ""

# Verificar si CDK está bootstrapped
Write-Host "[5/7] Verificando CDK bootstrap..." -ForegroundColor Yellow

$region = aws configure get region
if (-not $region) {
    $region = "us-east-1"
}

Write-Host "   Región: $region" -ForegroundColor Gray

# Intentar verificar si ya está bootstrapped
$bootstrapped = $false
try {
    $stacks = aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --output json | ConvertFrom-Json
    foreach ($stack in $stacks.StackSummaries) {
        if ($stack.StackName -like "CDKToolkit*") {
            $bootstrapped = $true
            break
        }
    }
} catch {
    # Ignorar errores
}

if (-not $bootstrapped) {
    Write-Host "   CDK no está bootstrapped. Ejecutando bootstrap..." -ForegroundColor Yellow
    cdk bootstrap
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en CDK bootstrap" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ CDK bootstrap completado" -ForegroundColor Green
} else {
    Write-Host "✅ CDK ya está bootstrapped" -ForegroundColor Green
}
Write-Host ""

# Sintetizar el stack
Write-Host "[6/7] Sintetizando CloudFormation template..." -ForegroundColor Yellow

cdk synth --context environment=$Environment
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error sintetizando el stack" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Template sintetizado exitosamente" -ForegroundColor Green
Write-Host ""

# Desplegar
Write-Host "[7/7] Desplegando a AWS..." -ForegroundColor Yellow
Write-Host ""

$deployArgs = @("deploy", "--all", "--context", "environment=$Environment")

if ($AutoApprove) {
    $deployArgs += "--require-approval"
    $deployArgs += "never"
    Write-Host "⚠️  Auto-aprobación habilitada" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Se te pedirá confirmación antes de crear recursos" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Ejecutando: cdk $($deployArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

& cdk $deployArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error durante el despliegue" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Despliegue Completado Exitosamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Obtener outputs del stack
Write-Host "📋 Outputs del Stack:" -ForegroundColor Cyan
Write-Host ""

try {
    $outputs = aws cloudformation describe-stacks --stack-name "DocumentAnalysis-$Environment" --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
    
    foreach ($output in $outputs) {
        Write-Host "  $($output.OutputKey):" -ForegroundColor Yellow
        Write-Host "    $($output.OutputValue)" -ForegroundColor White
        if ($output.Description) {
            Write-Host "    ($($output.Description))" -ForegroundColor Gray
        }
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  No se pudieron obtener los outputs del stack" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verifica los recursos en la consola de AWS" -ForegroundColor White
Write-Host "  2. Crea un usuario de prueba en Cognito" -ForegroundColor White
Write-Host "  3. Prueba el endpoint de health: curl <API_URL>/health" -ForegroundColor White
Write-Host ""
Write-Host "Para ver los logs:" -ForegroundColor Cyan
Write-Host "  aws logs tail /aws/lambda/BedrockProcessor-$Environment --follow" -ForegroundColor White
Write-Host ""
