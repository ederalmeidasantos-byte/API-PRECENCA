# Rotas do Presença Bank - Código Completo

## 📍 Localização

As rotas do Presença Bank estão no arquivo `routes-clt-utf8.js` (ou `routes/clt.js` no servidor).

**Arquivo completo**: `routes-clt-utf8.js` (7588 linhas)  
**Rotas do Presença Bank**: Linhas 6308-7584

---

## ⚠️ Nota Importante

Este arquivo contém **outras rotas além do Presença Bank**. As rotas do Presença Bank são apenas uma parte do arquivo.

Para usar apenas as rotas do Presença Bank, você pode:

1. **Extrair apenas as rotas do Presença Bank** para um arquivo separado (recomendado)
2. **Usar o arquivo completo** e registrar apenas as rotas necessárias
3. **Manter o arquivo completo** e usar todas as rotas

---

## 📝 Estrutura das Rotas

### Imports Necessários (linhas 6312-6319)

```javascript
const { 
  gerarTermoINSS, 
  consultarVinculos, 
  consultarMargem, 
  consultarTabelasDisponiveis 
} = require('../utils/precencabank-fluxo');
const { assinarTermoAutomaticamente } = require('../utils/precencabank-assinatura-automatica-otimizada');
```

### Dependências

- `utils/precencabank-fluxo.js`: Funções de integração com Presença Bank
- `utils/clt-fluxo.js`: Função `sincronizarOportunidadeKentro` e outras
- `utils/cache-precencabank.js`: Gerenciamento de cache
- `utils/precencabank-assinatura-automatica-otimizada.js`: Assinatura automática com Puppeteer

---

## 🔗 Endpoints Disponíveis

### 1. FASE 1: Gerar Termo INSS
**Endpoint**: `POST /clt/precencabank/teste/fase1-termo`  
**Linhas**: 6322-6588

**Funcionalidades**:
- Busca dados do cliente na Kentro
- Gera termo INSS via API Presença Bank
- Tratamento automático de erro "Telefone já utilizado" com retry usando telefone alternativo
- Salva `termoId`, `shortUrl`, `url` no cache

**Request Body**:
```json
{
  "cpf": "16183805831"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "resultado": {
    "termoId": "123456",
    "shortUrl": "https://short.url/abc123",
    "url": "https://presencabank.com/termo/123456"
  }
}
```

---

### 2. FASE 2: Assinar Termo
**Endpoint**: `POST /clt/precencabank/teste/fase2-assinatura`  
**Linhas**: 6589-6689

**Funcionalidades**:
- Assina termo usando Puppeteer
- Verifica se termo já está assinado
- Atualiza cache com `termoAssinado: true`

**Request Body**:
```json
{
  "cpf": "16183805831",
  "termoUrl": "https://presencabank.com/termo/123456"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "resultado": {
    "assinado": true,
    "urlAtual": "https://presencabank.com/termo/123456/assinado"
  }
}
```

---

### 3. FASE 3: Consultar Margem
**Endpoint**: `POST /clt/precencabank/teste/fase3-margem`  
**Linhas**: 7068-7239

**Funcionalidades**:
- Consulta vínculos empregatícios
- Extrai `matricula` e `cnpj` do primeiro vínculo
- Consulta margem disponível
- Salva `margem`, `dadosMargem`, `vinculo`, `matricula`, `cnpj` no cache

**Request Body**:
```json
{
  "cpf": "16183805831",
  "termoId": "123456"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "resultado": {
    "margem": {
      "valorDisponivel": 10000.00,
      "valorMaximo": 15000.00
    },
    "vinculo": {
      "matricula": "123456",
      "cnpj": "12345678000190"
    },
    "matricula": "123456",
    "cnpj": "12345678000190"
  }
}
```

---

### 4. FASE 4: Simulação
**Endpoint**: `POST /clt/precencabank/teste/fase4-simulacao`  
**Linhas**: 7242-7584

**Funcionalidades**:
- Busca dados da margem do cache (se não fornecidos)
- Consulta tabelas disponíveis para simulação
- Extrai valor da tabela com **maior prazo** (não da primeira)
- Salva simulação no cache **preservando dados anteriores** (margem, etc.)

**Request Body**:
```json
{
  "cpf": "16183805831",
  "dadosMargem": {
    "termoId": "123456",
    "matricula": "123456",
    "cnpj": "12345678000190",
    "margem": { ... }
  }
}
```

**Nota**: Se `dadosMargem` não for enviado, o sistema busca automaticamente do cache do servidor.

**Response de Sucesso**:
```json
{
  "success": true,
  "resultado": {
    "tabelas": [...],
    "quantidadeTabelas": 5,
    "valorLiberado": 15000.00,
    "dadosSimulacao": {
      "disbursement_amount": 15000.00,
      "operation_amount": 15000.00,
      "number_of_installments": 84,
      "valorLiberado": 15000.00,
      "valor": 15000.00,
      "tabelas": [...]
    }
  }
}
```

---

### 5. FASE 5: Sincronizar com Kentro
**Endpoint**: `POST /clt/precencabank/teste/fase5-kentro`  
**Linhas**: 6692-6987

**Funcionalidades**:
- Busca oportunidade na Kentro pelo CPF
- Extrai `valorLiberado` da simulação (Fase 4) do cache
- Sincroniza oportunidade na Kentro (atualiza `value` e move para stage 21)
- Salva dados no cache

**Request Body**:
```json
{
  "cpf": "16183805831"
}
```

**Response de Sucesso**:
```json
{
  "success": true,
  "resultado": {
    "oportunidadeId": "12345",
    "oportunidade": { ... },
    "dadosCliente": { ... },
    "dadosValidados": { ... },
    "resultadoKentro": {
      "id": "12345",
      "value": 15000.00,
      "fkStage": 21
    },
    "encontrado": true,
    "sincronizado": true
  }
}
```

---

### 6. Buscar Cache
**Endpoint**: `GET /clt/precencabank/teste/cache/:cpf`  
**Linhas**: 6990-7065

**Funcionalidades**:
- Retorna cache formatado do servidor
- Inclui dados de todas as fases executadas

**Response de Sucesso**:
```json
{
  "success": true,
  "cache": {
    "fase1": {
      "termoId": "123456",
      "shortUrl": "https://short.url/abc123",
      "url": "https://presencabank.com/termo/123456"
    },
    "fase2": {
      "assinado": true,
      "urlAtual": "https://presencabank.com/termo/123456/assinado"
    },
    "fase3": {
      "margem": { ... },
      "termoId": "123456",
      "matricula": "123456",
      "cnpj": "12345678000190"
    },
    "fase5": {
      "oportunidadeId": "12345",
      "oportunidade": { ... }
    }
  },
  "dados": { ... }
}
```

---

## 🔄 Fluxo de Dados no Cache

```
Fase 1 → { termoId, shortUrl, url }
Fase 2 → { termoAssinado: true, urlAtual }
Fase 3 → { margem, dadosMargem, vinculo, matricula, cnpj, termoId }
Fase 4 → { simulacao: { valorLiberado, number_of_installments, tabelas } }
         + PRESERVA: { margem, dadosMargem, termoId, matricula, cnpj, ... }
Fase 5 → { oportunidadeId, dadosCliente, resultadoKentro }
```

---

## ⚠️ Tratamento de Erros

### Fase 1: Telefone Já Utilizado
- **Erro detectado**: Status 400/409/422 com mensagem contendo "telefone"
- **Ação**: Gera telefone alternativo (`119` + últimos 8 dígitos do CPF)
- **Retry**: Automático, sem interrupção do processo

### Fase 2: Termo Não Assinado
- **Erro**: Termo não encontrado no cache
- **Solução**: Execute a Fase 1 primeiro

### Fase 3: Termo Inválido
- **Erro**: "O termo precisa estar assinado"
- **Solução**: Execute a Fase 2 (Assinar Termo) primeiro

### Fase 4: Dados da Margem Faltando
- **Erro**: "Dados da margem são obrigatórios"
- **Solução**: Execute a Fase 3 primeiro (ou forneça `dadosMargem` no request)

---

## 📚 Documentação Relacionada

- `docs/PRECENCABANK-FASES-1-5-COMPLETO.md`: Documentação completa das fases
- `docs/ARQUIVOS-PRECENCABANK-FUNCIONAIS.md`: Lista de arquivos funcionais
- `docs/ROTAS-PRECENCABANK-RESUMO.md`: Resumo das rotas

---

## 🔧 Como Usar

### Opção 1: Usar arquivo completo
```javascript
const router = require('./routes-clt-utf8');
app.use('/clt', router);
```

### Opção 2: Extrair apenas rotas do Presença Bank
Copie as linhas 6308-7584 do `routes-clt-utf8.js` para um novo arquivo `routes/precencabank-routes.js` e registre:

```javascript
const precencabankRoutes = require('./routes/precencabank-routes');
app.use('/clt', precencabankRoutes);
```

---

## ✅ Status

Todas as 5 fases estão **funcionando e testadas**.
