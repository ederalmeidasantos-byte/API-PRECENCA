# 🏦 API Presença Bank - Documentação Completa

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Ambientes](#ambientes)
- [Arquitetura](#arquitetura)
- [API Presença Bank](#api-presença-bank)
- [Fluxo Completo (6 Fases)](#fluxo-completo-6-fases)
- [Integração Kentro CRM](#integração-kentro-crm)
- [Endpoints](#endpoints)
- [Guia de Testes](#guia-de-testes)
- [Segurança](#segurança)

---

## 🎯 Visão Geral

Sistema de integração com **Presença Bank** para processamento automatizado de empréstimos consignados CLT. O sistema gerencia todo o fluxo desde a solicitação do termo até a aprovação final, com integração automática no CRM Kentro.

### Principais Funcionalidades

- ✅ Geração e assinatura automática de termos
- ✅ Consulta de margem consignável
- ✅ Simulação de empréstimos com múltiplas tabelas
- ✅ Integração automática com Kentro CRM
- ✅ Processamento em lote
- ✅ Sistema de cache inteligente
- ✅ Retry automático com exponential backoff
- ✅ Renovação automática de tokens

---

## 🌐 Ambientes

### 🧪 **Ambiente de Teste**
- **Porta:** `4000` (HTTP) / `4443` (HTTPS)
- **URL:** `http://72.60.159.149:4000`
- **Finalidade:** Desenvolvimento e testes
- **Interface de Testes:** `/teste-fases-precencabank.html`

### 🚀 **Ambiente de Produção**
- **Porta:** `5000` (HTTP) / `5443` (HTTPS)
- **URL:** `http://72.60.159.149:5000`
- **Finalidade:** Operação em produção
- **Características:**
  - Alta disponibilidade
  - Logs estruturados
  - Monitoramento via PM2
  - Rate limiting configurado
  - CORS restrito

### 📊 **Porta FGTS (Legado)**
- **Porta:** `3006`
- **URL:** `http://72.60.159.149:3006`
- **Finalidade:** Processamento FGTS

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Cliente Web   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Node.js + Express (Porta 4000)  │
│  ┌───────────────────────────────┐  │
│  │  Routes (clt.js)              │  │
│  │  - Fase 1-6 Endpoints         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Utils                        │  │
│  │  - precencabank-fluxo.js      │  │
│  │  - precencabank-auth.js       │  │
│  │  - clt-fluxo.js (Kentro)      │  │
│  └───────────────────────────────┘  │
└─────────┬───────────────────────────┘
          │
          ├──────────────────────────────┐
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Presença Bank   │          │   Kentro CRM     │
│  API Externa     │          │   API Externa    │
└──────────────────┘          └──────────────────┘
```

---

## 🏦 API Presença Bank

### Base URL
```
https://api.precenca.bank/v1
```

### Autenticação

#### Obter Token
```http
POST /auth/login
Content-Type: application/json

{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Características:**
- ⏱️ Token válido por 1 hora
- 🔄 Renovação automática implementada
- 💾 Cache de token em memória
- 🔐 Retry automático em caso de 401 Unauthorized

---

### Principais Endpoints da Presença Bank

#### 1️⃣ **Solicitar Termo**
```http
POST /termos/clt
Authorization: Bearer {token}
Content-Type: application/json

{
  "cpf": "12345678901",
  "tipoOperacao": "CLT"
}
```

**Resposta:**
```json
{
  "id": "termo_123456",
  "token": "abc123def456",
  "url": "https://termos.precenca.bank/assinar/abc123def456",
  "status": "pendente",
  "criadoEm": "2025-11-16T00:00:00.000Z"
}
```

---

#### 2️⃣ **Assinar Termo**
```http
POST /termos/{termoId}/assinar
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "abc123def456",
  "assinatura": "digital_signature_hash"
}
```

**Resposta:**
```json
{
  "status": "assinado",
  "dataAssinatura": "2025-11-16T00:00:00.000Z"
}
```

**⚠️ Nota:** Nossa implementação usa **Puppeteer** para automação da assinatura via navegador headless.

---

#### 3️⃣ **Consultar Margem**
```http
POST /margem/consultar
Authorization: Bearer {token}
Content-Type: application/json

{
  "cpf": "12345678901",
  "matricula": "21",
  "cnpj": "06345582000124"
}
```

**Resposta:**
```json
{
  "margem": {
    "numeroInscricaoEmpregador": "06345582000124",
    "valorMargem": 833.43,
    "matricula": "21",
    "dataAdmissao": "2023-05-04",
    "dataNascimento": "1986-05-01",
    "valorMargemAvaliavel": 833.43,
    "valorBaseMargem": 2381.22,
    "valorTotalVencimentos": 4055.55,
    "nomeMae": "MARIA DA SILVA",
    "sexo": "Masculino"
  },
  "vinculo": {
    "matricula": "21",
    "numeroInscricaoEmpregador": "06345582000124",
    "elegivel": true,
    "cpf": "12345678901"
  }
}
```

---

#### 4️⃣ **Simular Empréstimo**
```http
POST /simulacao/tabelas
Authorization: Bearer {token}
Content-Type: application/json

{
  "cpf": "12345678901",
  "valorMargem": 833.43,
  "matricula": "21",
  "cnpj": "06345582000124"
}
```

**Resposta:**
```json
{
  "tabelas": [
    {
      "id": "tabela_001",
      "nome": "Tabela A - 24 meses",
      "prazo": 24,
      "quantidadeParcelas": 24,
      "valorParcela": 100.50,
      "valorTotal": 2412.00,
      "valorLiberado": 2000.00,
      "taxaJuros": 2.5,
      "taxaJurosMensal": 2.5,
      "taxaJurosAnual": 34.5,
      "cet": 36.2
    },
    {
      "id": "tabela_002",
      "nome": "Tabela B - 36 meses",
      "prazo": 36,
      "quantidadeParcelas": 36,
      "valorParcela": 75.30,
      "valorTotal": 2710.80,
      "valorLiberado": 2200.00,
      "taxaJuros": 2.3,
      "taxaJurosMensal": 2.3,
      "taxaJurosAnual": 31.4,
      "cet": 33.8
    }
  ],
  "quantidadeTabelas": 2
}
```

---

### ⚠️ Tratamento de Erros da Presença Bank

#### Erro 401 - Token Expirado
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token expirado ou inválido"
}
```
**Ação Automática:** Sistema renova o token automaticamente e tenta novamente.

#### Erro 429 - Rate Limit
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Limite de requisições excedido",
  "retryAfter": 60
}
```
**Ação Automática:** Sistema aguarda o tempo especificado e tenta novamente (até 5 tentativas com exponential backoff).

#### Erro 400 - Dados Inválidos
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "CPF inválido ou margem insuficiente",
  "details": {
    "campo": "cpf",
    "motivo": "CPF deve conter 11 dígitos"
  }
}
```

---

## 🔄 Fluxo Completo (6 Fases)

### 📊 Diagrama do Fluxo

```
┌─────────────────┐
│   FASE 1        │  Solicitar Termo
│   Termo         │  POST /precencabank/teste/fase1-termo
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FASE 2        │  Assinar Termo (Puppeteer)
│   Assinatura    │  POST /precencabank/teste/fase2-assinar
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FASE 3        │  Consultar Margem
│   Margem        │  POST /precencabank/teste/fase3-margem
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FASE 4        │  Consultar Tabelas
│   Simulação     │  POST /precencabank/teste/fase4-simulacao
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FASE 5        │  Integrar com Kentro
│   Kentro        │  POST /precencabank/teste/fase5-kentro
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FASE 6        │  Executar Tudo (Fases 1-4)
│   Fluxo Completo│  POST /precencabank/teste/fase6-fluxo-completo
└─────────────────┘
```

---

### 📝 Detalhamento de Cada Fase

#### 🔵 **FASE 1: Solicitar Termo**

**Endpoint:** `POST /clt/precencabank/teste/fase1-termo`

**Descrição:** Solicita a geração de um termo de autorização na Presença Bank.

**Body:**
```json
{
  "cpf": "12345678901"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Termo gerado com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "termo": {
      "id": "termo_123456",
      "token": "abc123def456",
      "url": "https://termos.precenca.bank/assinar/abc123def456",
      "status": "pendente"
    },
    "timestamp": "2025-11-16T00:00:00.000Z"
  }
}
```

**Cache:** ✅ Resultado salvo no localStorage (chave: `precencabank_teste_1_{cpf}`)

---

#### 🔵 **FASE 2: Assinar Termo**

**Endpoint:** `POST /clt/precencabank/teste/fase2-assinar`

**Descrição:** Assina o termo usando Puppeteer (automação de navegador).

**Body:**
```json
{
  "cpf": "12345678901",
  "termoId": "termo_123456",
  "termoToken": "abc123def456"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Termo assinado com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "assinatura": {
      "status": "assinado",
      "metodo": "puppeteer",
      "dataAssinatura": "2025-11-16T00:00:00.000Z"
    },
    "timestamp": "2025-11-16T00:00:00.000Z"
  }
}
```

**⚙️ Tecnologia:**
- Puppeteer (navegador headless)
- Chromium
- Timeout: 30 segundos

**Cache:** ✅ Resultado salvo no localStorage

---

#### 🔵 **FASE 3: Consultar Margem**

**Endpoint:** `POST /clt/precencabank/teste/fase3-margem`

**Descrição:** Consulta a margem consignável disponível do trabalhador.

**Body:**
```json
{
  "cpf": "12345678901"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Margem consultada com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "margem": {
      "margem": {
        "numeroInscricaoEmpregador": "06345582000124",
        "valorMargem": 833.43,
        "matricula": "21",
        "dataAdmissao": "2023-05-04",
        "dataNascimento": "1986-05-01",
        "valorMargemAvaliavel": 833.43,
        "valorBaseMargem": 2381.22,
        "valorTotalVencimentos": 4055.55,
        "nomeMae": "MARIA DA SILVA",
        "sexo": "Masculino"
      },
      "vinculo": {
        "matricula": "21",
        "numeroInscricaoEmpregador": "06345582000124",
        "elegivel": true,
        "cpf": "12345678901"
      },
      "matricula": "21",
      "cnpj": "06345582000124"
    },
    "timestamp": "2025-11-16T00:00:00.000Z"
  }
}
```

**⚠️ Importante:**
- Valida se o termo foi assinado (Fase 2)
- Extrai automaticamente matrícula e CNPJ
- Verifica elegibilidade

**Cache:** ✅ Resultado salvo no localStorage

---

#### 🔵 **FASE 4: Simulação**

**Endpoint:** `POST /clt/precencabank/teste/fase4-simulacao`

**Descrição:** Consulta tabelas de empréstimo disponíveis com diferentes prazos.

**Body:**
```json
{
  "cpf": "12345678901",
  "dadosMargem": {
    "margem": {
      "valorMargem": 833.43,
      "matricula": "21",
      "numeroInscricaoEmpregador": "06345582000124"
    },
    "matricula": "21",
    "cnpj": "06345582000124"
  }
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Tabelas consultadas com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "tabelas": [
      {
        "id": "tabela_001",
        "nome": "Tabela A - 24 meses",
        "prazo": 24,
        "quantidadeParcelas": 24,
        "valorParcela": 100.50,
        "valorTotal": 2412.00,
        "valorLiberado": 2000.00,
        "taxaJuros": 2.5,
        "taxaJurosMensal": 2.5,
        "taxaJurosAnual": 34.5,
        "cet": 36.2
      }
    ],
    "quantidadeTabelas": 1,
    "timestamp": "2025-11-16T00:00:00.000Z"
  }
}
```

**Cache:** ✅ Resultado salvo no localStorage

---

#### 🟣 **FASE 5: Integração Kentro** ⭐

**Endpoint:** `POST /clt/precencabank/teste/fase5-kentro`

**Descrição:** Integra a simulação aprovada no CRM Kentro (Fila 4, Fase 21).

**Body:**
```json
{
  "cpf": "12345678901",
  "tabelaSelecionada": {
    "id": "tabela_001",
    "nome": "Tabela A - 24 meses",
    "prazo": 24,
    "valorLiberado": 2000.00,
    "valorParcela": 100.50,
    "taxaJuros": 2.5
  }
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Integração com Kentro concluída com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "tabelaSelecionada": {
      "id": "tabela_001",
      "nome": "Tabela A - 24 meses",
      "prazo": 24,
      "valorLiberado": 2000.00,
      "valorParcela": 100.50,
      "taxaJuros": 2.5
    },
    "kentro": {
      "success": true,
      "action": "moved",
      "opportunityId": "opp_123456",
      "faseAnterior": 15,
      "faseAtual": 21,
      "valorAtualizado": 2000.00,
      "fila": 4,
      "nomeFase": "Aprovado"
    },
    "resumo": {
      "cpf": "12345678901",
      "oportunidade_id": "opp_123456",
      "acao": "Movida",
      "fila": 4,
      "fase": 21,
      "nome_fase": "Aprovado",
      "valor_atualizado": 2000.00,
      "executado_em": "2025-11-16T00:00:00.000Z"
    }
  }
}
```

**⚠️ Pré-requisitos:**
- Fase 4 executada (precisa dos dados da simulação)
- Cliente deve existir na Kentro

**Lógica:**
1. 🔍 Busca oportunidade do cliente na Kentro
2. ✅ Verifica se já existe na Fila 4
3. **Se existe:** Move para Fase 21 e atualiza valor
4. **Se não existe:** Cria nova oportunidade na Fase 21
5. 💰 Atualiza valor liberado

---

#### 🟢 **FASE 6: Fluxo Completo** ⭐

**Endpoint:** `POST /clt/precencabank/teste/fase6-fluxo-completo`

**Descrição:** Executa automaticamente as Fases 1, 2, 3 e 4 em sequência.

**Body:**
```json
{
  "cpf": "12345678901"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Fluxo completo executado com sucesso!",
  "resultado": {
    "cpf": "12345678901",
    "fases": {
      "fase1": {
        "termo": { "id": "termo_123456", "token": "abc123" },
        "timestamp": "2025-11-16T00:00:00.000Z"
      },
      "fase2": {
        "assinatura": { "status": "assinado" },
        "timestamp": "2025-11-16T00:00:01.000Z"
      },
      "fase3": {
        "margem": { "valorMargem": 833.43 },
        "timestamp": "2025-11-16T00:00:02.000Z"
      },
      "fase4": {
        "tabelas": [...],
        "quantidadeTabelas": 3,
        "timestamp": "2025-11-16T00:00:03.000Z"
      }
    },
    "resumo": {
      "tempo_total": "15.3s",
      "fases_executadas": 4,
      "status": "concluido"
    }
  }
}
```

**⏱️ Tempo Estimado:** 15-20 segundos

**Delays entre fases:**
- Fase 1 → Fase 2: 2 segundos
- Fase 2 → Fase 3: 2 segundos
- Fase 3 → Fase 4: 2 segundos

---

## 🔗 Integração Kentro CRM

### Base URL
```
https://api.kentro.digital
```

### Autenticação Kentro
```http
GET /api/opportunities
Authorization: Bearer {kentro_token}
```

### Fila 4 - CLT Consignado

#### Estrutura de Fases (Fila 4)
| Fase | Nome | Descrição |
|------|------|-----------|
| 1 | Lead | Cliente em prospecção |
| 5 | Análise | Em análise de crédito |
| 15 | Aguardando Documentos | Pendente de documentação |
| **21** | **Aprovado** | ✅ **Aprovado pela Presença Bank** |
| 25 | Contratado | Contrato assinado |
| 30 | Liberado | Valor liberado |

### Endpoints Kentro Utilizados

#### 1. Buscar Oportunidade por CPF
```http
GET /api/opportunities?filters[cpf]={cpf}&filters[queue_id]=4
Authorization: Bearer {token}
```

#### 2. Mover para Fase 21 (Aprovado)
```http
PUT /api/opportunities/{opportunityId}/move
Authorization: Bearer {token}
Content-Type: application/json

{
  "stage_id": 21,
  "fields": {
    "valor_liberado": 2000.00,
    "taxa_juros": 2.5,
    "prazo": 24,
    "tabela_selecionada": "Tabela A - 24 meses"
  }
}
```

#### 3. Criar Nova Oportunidade na Fila 4
```http
POST /api/opportunities
Authorization: Bearer {token}
Content-Type: application/json

{
  "queue_id": 4,
  "stage_id": 21,
  "contact": {
    "cpf": "12345678901",
    "name": "João da Silva",
    "phone": "11999999999",
    "email": "joao@example.com"
  },
  "fields": {
    "valor_liberado": 2000.00,
    "taxa_juros": 2.5,
    "prazo": 24,
    "data_nascimento": "1986-05-01",
    "nome_mae": "Maria da Silva"
  }
}
```

### 🔄 Fluxo de Integração Kentro

```
┌─────────────────────────────────────┐
│  1. Buscar CPF na Kentro            │
└────────┬────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │ Existe? │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   SIM       NÃO
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ Mover   │ │ Criar Nova   │
│ p/ F21  │ │ Oportunidade │
└─────────┘ └──────────────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Atualizar Valor Liberado + Campos  │
└─────────────────────────────────────┘
```

---

## 📡 Endpoints

### Base Path: `/clt/precencabank/teste`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/fase1-termo` | Gerar termo | ❌ |
| POST | `/fase2-assinar` | Assinar termo | ❌ |
| POST | `/fase3-margem` | Consultar margem | ❌ |
| POST | `/fase4-simulacao` | Consultar tabelas | ❌ |
| POST | `/fase5-kentro` | Integrar Kentro | ❌ |
| POST | `/fase6-fluxo-completo` | Executar fluxo completo | ❌ |

**Nota:** Autenticação interna gerenciada automaticamente pelo sistema.

---

## 🧪 Guia de Testes

### Interface Web de Testes

**URL:** `http://72.60.159.149:4000/teste-fases-precencabank.html`

### Testando Fase por Fase

#### 1️⃣ Testar Fase 1 (Termo)
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase1-termo \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678901"}'
```

#### 2️⃣ Testar Fase 2 (Assinatura)
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase2-assinar \
  -H "Content-Type: application/json" \
  -d '{
    "cpf":"12345678901",
    "termoId":"termo_123456",
    "termoToken":"abc123def456"
  }'
```

#### 3️⃣ Testar Fase 3 (Margem)
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase3-margem \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678901"}'
```

#### 4️⃣ Testar Fase 4 (Simulação)
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase4-simulacao \
  -H "Content-Type: application/json" \
  -d '{
    "cpf":"12345678901",
    "dadosMargem": {
      "margem": {"valorMargem": 833.43},
      "matricula": "21",
      "cnpj": "06345582000124"
    }
  }'
```

#### 5️⃣ Testar Fase 5 (Kentro)
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase5-kentro \
  -H "Content-Type: application/json" \
  -d '{
    "cpf":"12345678901",
    "tabelaSelecionada": {
      "id": "tabela_001",
      "nome": "Tabela A - 24 meses",
      "prazo": 24,
      "valorLiberado": 2000.00,
      "valorParcela": 100.50,
      "taxaJuros": 2.5
    }
  }'
```

#### 6️⃣ Testar Fluxo Completo
```bash
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase6-fluxo-completo \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678901"}'
```

### CPFs de Teste Válidos
- `00949829021` - Cliente com margem ativa
- `12345678901` - Cliente exemplo

---

## 🔐 Segurança

### Implementações de Segurança

#### 1. Renovação Automática de Token
```javascript
// Em caso de 401, renova automaticamente
if (statusCode === 401) {
  await renewToken();
  return retry(requestFn);
}
```

#### 2. Rate Limiting
- Retry automático com exponential backoff
- Máximo de 5 tentativas
- Respeita header `Retry-After`

#### 3. Validação de Dados
- CPF: 11 dígitos obrigatório
- Validação de campos obrigatórios
- Sanitização de inputs

#### 4. Cache Inteligente
- Token armazenado em memória (não em disco)
- Cache de resultados no localStorage (client-side)
- Expiração automática

#### 5. HTTPS
- Certificados SSL válidos
- Porta 4443 (teste) e 5443 (produção)

---

## 📊 Monitoramento

### PM2
```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs clt-v8-api

# Ver métricas
pm2 monit
```

### Health Check
```bash
curl http://72.60.159.149:4000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 🐛 Troubleshooting

### Problema: Token Expirado
**Solução:** Sistema renova automaticamente. Se persistir, verificar credenciais.

### Problema: Erro 429 (Rate Limit)
**Solução:** Aguardar 60 segundos ou verificar header `Retry-After`.

### Problema: Puppeteer Timeout
**Solução:** 
1. Verificar se o Chrome está instalado
2. Aumentar timeout (padrão: 30s)
3. Verificar logs: `pm2 logs clt-v8-api --err`

### Problema: Kentro Não Atualiza
**Solução:**
1. Verificar token Kentro válido
2. Confirmar que oportunidade existe
3. Verificar permissões na Fila 4

---

## 📞 Suporte

**Documentação Completa:** Este repositório

**Logs:** `pm2 logs clt-v8-api`

**Ambiente de Teste:** http://72.60.159.149:4000/teste-fases-precencabank.html

---

## 📝 Changelog

### v1.0.0 - 2025-11-16
- ✅ Implementação das 6 fases
- ✅ Integração com Presença Bank
- ✅ Integração com Kentro CRM
- ✅ Sistema de cache
- ✅ Renovação automática de token
- ✅ Retry com exponential backoff
- ✅ Interface web de testes

---

## 📄 Licença

Proprietário - Lunas Digital

---

**Desenvolvido por:** Equipe Lunas Digital  
**Última Atualização:** 16/11/2025