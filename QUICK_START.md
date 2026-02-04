# 🚀 Quick Start - Despliegue Rápido

## Despliegue en 3 Pasos

### 1️⃣ Instalar Dependencias

```powershell
cd infrastructure
npm install
```

### 2️⃣ Desplegar a AWS

```powershell
# Volver al directorio raíz
cd ..

# Ejecutar script de despliegue
.\deploy.ps1
```

### 3️⃣ Verificar el Despliegue

```powershell
.\verify-deployment.ps1
```

---

## ⚡ Comandos Rápidos

### Desplegar
```powershell
.\deploy.ps1
```

### Desplegar con auto-aprobación (sin confirmación)
```powershell
.\deploy.ps1 -AutoApprove
```

### Desplegar a staging
```powershell
.\deploy.ps1 -Environment staging
```

### Verificar recursos
```powershell
.\verify-deployment.ps1
```

### Ver logs en tiempo real
```powershell
aws logs tail /aws/lambda/BedrockProcessor-dev --follow
```

### Eliminar todo
```powershell
cd infrastructure
cdk destroy --all
```

---

## 📋 Requisitos Previos

- ✅ Node.js 20.x
- ✅ Python 3.12
- ✅ AWS CLI configurado (`aws configure`)
- ✅ AWS CDK CLI (`npm install -g aws-cdk`)

---

## 🔍 Verificar Requisitos

```powershell
# Verificar Node.js
node --version

# Verificar AWS CLI
aws --version

# Verificar CDK
cdk --version

# Verificar credenciales AWS
aws sts get-caller-identity
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guía completa de despliegue
- **[BACKEND_IMPLEMENTATION_COMPLETE.md](BACKEND_IMPLEMENTATION_COMPLETE.md)** - Resumen de implementación

---

## 🆘 Problemas Comunes

### "CDK bootstrap required"
```powershell
cd infrastructure
cdk bootstrap
```

### "AWS credentials not configured"
```powershell
aws configure
```

### Error de compilación TypeScript
```powershell
cd infrastructure
npm install
npm run build
```

---

## ✅ Después del Despliegue

1. **Obtener la URL del API**:
```powershell
aws cloudformation describe-stacks --stack-name DocumentAnalysis-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text
```

2. **Crear usuario de prueba**:
```powershell
$USER_POOL_ID = aws cloudformation describe-stacks --stack-name DocumentAnalysis-dev --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text

aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username test@example.com --temporary-password TempPass123!
```

3. **Probar el API**:
```powershell
$API_URL = aws cloudformation describe-stacks --stack-name DocumentAnalysis-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text

curl "${API_URL}health"
```

---

## 🎉 ¡Listo!

Tu backend está desplegado y funcionando. Ahora puedes:
- Desarrollar el frontend (React)
- Probar los endpoints del API
- Monitorear con CloudWatch
- Escalar según necesites

---

**Tiempo estimado**: 10-15 minutos para el primer despliegue
