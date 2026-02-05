# 🚀 Inicio Rápido - Deployment a Producción

## Pasos Rápidos (5 minutos)

### 1. Actualizar GitHub

```powershell
# Commit y push de todos los cambios
.\update-github.ps1 -CommitMessage "Production ready: CloudFront + deployment automation"
```

### 2. Desplegar a AWS

```powershell
# Deployment completo a producción
.\deploy-production.ps1 -Environment prod
```

**¡Eso es todo!** El script se encarga de:
- ✅ Verificar prerequisitos
- ✅ Ejecutar tests
- ✅ Build de Lambda packages
- ✅ Deploy de infraestructura (CDK)
- ✅ Build y deploy del frontend
- ✅ Invalidar cache de CloudFront

---

## Verificación Rápida

```powershell
# Ver la URL de tu aplicación
aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text
```

---

## Crear Usuario de Prueba

```powershell
# Obtener User Pool ID
$USER_POOL_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text

# Crear usuario
aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username admin@documentia.com --user-attributes Name=email,Value=admin@documentia.com Name=email_verified,Value=true --temporary-password "TempPass123!" --message-action SUPPRESS

# Establecer password permanente
aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username admin@documentia.com --password "Admin123!Pass" --permanent
```

---

## Troubleshooting Rápido

### Problema: CDK Bootstrap falla
```powershell
cdk bootstrap aws://520754296204/us-east-1 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

### Problema: Frontend no carga
```powershell
# Invalidar cache de CloudFront
$DISTRIBUTION_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### Problema: Bedrock Access Denied
1. Ve a AWS Console → Bedrock → Model access
2. Solicita acceso a Claude 3 Sonnet
3. Espera aprobación (usualmente instantánea)

---

## Documentación Completa

Para más detalles, ver:
- **[PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)**: Guía completa paso a paso
- **[PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md)**: Resumen de todo lo implementado

---

## Comandos Útiles

```powershell
# Ver logs de Lambda
aws logs tail /aws/lambda/BedrockProcessor-prod --follow

# Ver estado del stack
aws cloudformation describe-stacks --stack-name DocumentAnalysisStack-prod

# Listar distribuciones de CloudFront
aws cloudfront list-distributions

# Ver buckets S3
aws s3 ls | Select-String "document-analysis"
```

---

**¿Listo para producción?** Ejecuta: `.\deploy-production.ps1 -Environment prod` 🚀
