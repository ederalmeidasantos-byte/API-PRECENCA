# 🔄 Processamento Assíncrono PrecençaBank

## 📋 Visão Geral

O sistema PrecençaBank agora processa requisições de forma **assíncrona** com cache, evitando que a API fique bloqueada esperando o processamento completo.

## 🚀 Como Funciona

### 1. Enviar CPF para Processamento

**Endpoint:** `POST /clt/fluxo-completo-precencabank`

**Request:**
```json
{
  "cpf": "08037428940",
  "valor": 10000,
  "prazo": 36
}
```

**Response (Imediata):**
```json
{
  "success": true,
  "message": "Processamento iniciado em background",
  "origem": "PRECENÇABANK",
  "status": "PROCESSANDO",
  "cpf": "08037428940",
  "consultaStatus": "/clt/status-precencabank/08037428940",
  "timestamp": "2025-11-06T15:30:00.000Z"
}
```

### 2. Consultar Status do Processamento

**Endpoint:** `GET /clt/status-precencabank/:cpf`

**Exemplo:**
```bash
GET /clt/status-precencabank/08037428940
```

**Response (Processando):**
```json
{
  "success": true,
  "origem": "PRECENÇABANK",
  "status": "PROCESSANDO",
  "etapa": "consultando_vinculos",
  "dados": {
    "cpf": "08037428940",
    "status": "PROCESSANDO",
    "etapa": "consultando_vinculos",
    "inicioProcessamento": "2025-11-06T15:30:00.000Z",
    "ultimaAtualizacao": "2025-11-06T15:30:45.000Z"
  },
  "timestamp": "2025-11-06T15:30:50.000Z"
}
```

**Response (Concluído):**
```json
{
  "success": true,
  "origem": "PRECENÇABANK",
  "status": "CONCLUIDO",
  "etapa": "finalizado",
  "dados": {
    "cpf": "08037428940",
    "status": "CONCLUIDO",
    "etapa": "finalizado",
    "resultado": {
      "sucesso": true,
      "origem": "PRECENÇABANK",
      "termo": {...},
      "vinculos": [...],
      "margem": {...},
      "tabelas": [...],
      "operacao": {...}
    },
    "fimProcessamento": "2025-11-06T15:32:00.000Z"
  },
  "timestamp": "2025-11-06T15:32:05.000Z"
}
```

**Response (Erro):**
```json
{
  "success": true,
  "origem": "PRECENÇABANK",
  "status": "ERRO",
  "etapa": "consultando_vinculos",
  "dados": {
    "cpf": "08037428940",
    "status": "ERRO",
    "etapa": "consultando_vinculos",
    "erro": "Request failed with status code 429",
    "fimProcessamento": "2025-11-06T15:31:00.000Z"
  },
  "timestamp": "2025-11-06T15:31:05.000Z"
}
```

## 🔄 Fluxo de Processamento

1. **Cliente envia CPF** → API retorna imediatamente com status "PROCESSANDO"
2. **Processamento em background:**
   - Buscar oportunidade na Kentro
   - Validar dados
   - Gerar termo INSS
   - Assinar termo
   - Consultar vínculos (com retry automático)
   - Consultar margem
   - Consultar tabelas
   - Criar operação
3. **Cliente consulta status** → Retorna etapa atual ou resultado final

## 💾 Sistema de Cache

### Características:
- ✅ Cache automático por CPF
- ✅ Status atualizado em tempo real
- ✅ Cache válido por 24 horas após conclusão
- ✅ Detecção de processamento travado (timeout de 30 minutos)
- ✅ Retry automático para erros 429 (Rate Limit)

### Localização do Cache:
```
data/cache/precencabank-processamento.json
```

## 🏥 Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-06T15:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "precencabank": {
    "cache": {
      "total": 5,
      "processando": 2,
      "concluidos": 2,
      "erros": 1
    },
    "endpoints": {
      "fluxoCompleto": "/clt/fluxo-completo-precencabank",
      "status": "/clt/status-precencabank/:cpf"
    }
  }
}
```

## 📊 Etapas do Processamento

| Etapa | Descrição |
|-------|-----------|
| `buscando_oportunidade` | Buscando CPF na Kentro |
| `buscando_oportunidade_id` | Obtendo dados completos da oportunidade |
| `validando_dados` | Validando dados obrigatórios |
| `gerando_termo` | Gerando termo INSS |
| `assinando_termo` | Assinando termo automaticamente |
| `consultando_vinculos` | Consultando vínculos empregatícios (pode demorar) |
| `consultando_margem` | Consultando margem disponível |
| `consultando_tabelas` | Consultando tabelas disponíveis |
| `criando_operacao` | Criando operação final |
| `finalizado` | Processamento concluído |

## ⚠️ Comportamentos Especiais

### 1. CPF Já em Processamento
Se o CPF já estiver sendo processado, a API retorna o status atual sem iniciar novo processamento.

### 2. Cache de Resultado
Se o CPF foi processado nas últimas 24 horas, a API retorna o resultado do cache imediatamente.

### 3. Timeout Automático
Se um processamento ficar mais de 30 minutos sem atualização, é automaticamente marcado como erro.

### 4. Retry Automático
Erros 429 (Rate Limit) são tratados automaticamente com retry e backoff exponencial.

## 🧪 Testes

### Testar Health Check
```bash
node tests/testar-api-health.js
```

### Testar Processamento
```bash
# Enviar CPF
curl -X POST http://72.60.159.149:4000/clt/fluxo-completo-precencabank \
  -H "Content-Type: application/json" \
  -d '{"cpf": "08037428940"}'

# Consultar status
curl http://72.60.159.149:4000/clt/status-precencabank/08037428940
```

## 📝 Notas Importantes

- ⏱️ Processamento pode levar 2-5 minutos
- 🔄 Consultar status periodicamente (polling a cada 10-30 segundos)
- 💾 Resultados ficam em cache por 24 horas
- 🚫 Não enviar o mesmo CPF múltiplas vezes simultaneamente
- ✅ Sistema detecta automaticamente processamentos duplicados
