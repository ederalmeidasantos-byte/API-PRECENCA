# Integração Presença Bank - Fases 1 a 5 - Documentação Completa

## 📋 Visão Geral

Este documento detalha o funcionamento completo das 5 fases da integração com o Presença Bank, desde a geração do termo até a sincronização com a Kentro.

## 🔄 Fluxo Completo

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5
  ↓        ↓        ↓        ↓        ↓
Termo   Assinar  Margem  Simulação  Kentro
```

---

## 📍 FASE 1: Gerar Termo INSS

### Endpoint
```
POST /clt/precencabank/teste/fase1-termo
```

### Request Body
```json
{
  "cpf": "16183805831"
}
```

### Funcionalidades

1. **Geração do Termo**
   - Busca dados do cliente na Kentro
   - Gera termo INSS via API Presença Bank
   - Retorna `termoId` e `shortUrl`

2. **Tratamento de Erro: Telefone Já Utilizado**
   - Detecta erro "Telefone já utilizado" (status 400, 409, 422)
   - Gera telefone alternativo: `119` + últimos 8 dígitos do CPF
   - Tenta novamente automaticamente
   - Logs detalhados do processo

3. **Cache**
   - Salva `termoId`, `shortUrl`, `url` no cache do servidor
   - Permite recuperação posterior

### Response de Sucesso
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

### Código Principal
- **Arquivo**: `routes-clt-utf8.js` (linhas ~6900-7055)
- **Função**: `gerarTermoINSS` em `utils/precencabank-fluxo.js`

---

## 📍 FASE 2: Assinar Termo

### Endpoint
```
POST /clt/precencabank/teste/fase2-assinar
```

### Request Body
```json
{
  "cpf": "16183805831",
  "termoId": "123456"
}
```

### Funcionalidades

1. **Verificação de Assinatura**
   - Verifica se termo já está assinado
   - Retorna status atual

2. **Cache**
   - Atualiza cache com `termoAssinado: true`
   - Salva `urlAtual` do termo assinado

### Response de Sucesso
```json
{
  "success": true,
  "resultado": {
    "assinado": true,
    "urlAtual": "https://presencabank.com/termo/123456/assinado"
  }
}
```

### Código Principal
- **Arquivo**: `routes-clt-utf8.js` (linhas ~7056-7079)

---

## 📍 FASE 3: Consultar Margem

### Endpoint
```
POST /clt/precencabank/teste/fase3-margem
```

### Request Body
```json
{
  "cpf": "16183805831",
  "termoId": "123456"
}
```

### Funcionalidades

1. **Consulta de Vínculos**
   - Busca vínculos empregatícios do cliente
   - Extrai `matricula` e `cnpj` do primeiro vínculo

2. **Consulta de Margem**
   - Consulta margem disponível usando:
     - `cpf`
     - `matricula`
     - `cnpj`
     - `termoId`

3. **Cache**
   - Salva `margem` (dados completos da margem)
   - Salva `dadosMargem` (termoId, matricula, cnpj)
   - Salva `vinculo` (dados do vínculo)
   - **IMPORTANTE**: Esses dados são necessários para a Fase 4

### Response de Sucesso
```json
{
  "success": true,
  "resultado": {
    "margem": {
      "valorDisponivel": 10000.00,
      "valorMaximo": 15000.00,
      ...
    },
    "vinculo": {
      "matricula": "123456",
      "cnpj": "12345678000190",
      ...
    }
  }
}
```

### Código Principal
- **Arquivo**: `routes-clt-utf8.js` (linhas ~7067-7239)
- **Funções**: `consultarVinculos`, `consultarMargem` em `utils/precencabank-fluxo.js`

---

## 📍 FASE 4: Simulação

### Endpoint
```
POST /clt/precencabank/teste/fase4-simulacao
```

### Request Body
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

### Funcionalidades

1. **Busca de Dados da Margem**
   - Se não recebido, busca do cache do servidor
   - Prioridade: `dados.margem` → `dados.dadosMargem.margem` → `buscarDadosMargem()`

2. **Simulação**
   - Executa simulação via API Presença Bank
   - Retorna múltiplas tabelas com diferentes prazos

3. **Extração do Valor e Prazo**
   - **Prioridade para encontrar maior prazo**:
     1. `tabela.prazo` (campo principal)
     2. `tabela.number_of_installments`
     3. `tabela.parcelas`
   - **Prioridade para extrair valor**:
     1. `tabela.valorLiberado` (campo principal)
     2. `tabela.disbursement_amount`
     3. `tabela.operation_amount`
     4. `tabela.valorMaximo`
     5. `tabela.valor`

4. **Fallback**
   - Se não encontrar tabela com maior prazo, usa primeira tabela disponível
   - Garante que sempre há um valor salvo

5. **Cache**
   - Salva `simulacao` com:
     - `valorLiberado`: valor extraído
     - `number_of_installments`: prazo em meses
     - `disbursement_amount`: valor de desembolso
     - `operation_amount`: valor da operação
     - `tabelas`: array completo de tabelas
   - **PRESERVA** dados anteriores (margem, dadosMargem, termoId, etc.)

### Response de Sucesso
```json
{
  "success": true,
  "resultado": {
    "valorLiberado": 6946.40,
    "quantidadeTabelas": 3,
    "dadosSimulacao": {
      "valorLiberado": 6946.40,
      "number_of_installments": 24,
      "disbursement_amount": 6946.40,
      "operation_amount": 6946.40,
      "tabelas": [
        {
          "prazo": 12,
          "valorLiberado": 5019.67,
          "nome": "Privado CLT - 12x - 6,99% - 15k-"
        },
        {
          "prazo": 24,
          "valorLiberado": 6946.40,
          "nome": "Privado CLT - 24x - 6,99% - 15k-"
        }
      ]
    }
  }
}
```

### Código Principal
- **Arquivo**: `routes-clt-utf8.js` (linhas ~7241-7576)
- **Função**: `simularCredito` em `utils/precencabank-fluxo.js`

---

## 📍 FASE 5: Sincronizar com Kentro

### Endpoint
```
POST /clt/precencabank/teste/fase5-kentro
```

### Request Body
```json
{
  "cpf": "16183805831"
}
```

### Funcionalidades

1. **Busca de Oportunidade na Kentro**
   - Busca em múltiplas filas (1, 3, 4)
   - Se não encontrar, busca especificamente na Fila 4

2. **Validação de Dados**
   - Valida se oportunidade tem dados obrigatórios
   - Prepara dados no formato padrão

3. **Extração do Valor da Simulação**
   - **Ordem de prioridade**:
     1. `dadosCliente.valorLiberado` (direto)
     2. `dadosSimulacao.valorLiberado`
     3. `dadosSimulacao.valor`
     4. `dadosSimulacao.disbursement_amount`
     5. `dadosSimulacao.operation_amount`
     6. `dadosSimulacao.valorMaximo`
     7. Se tiver `tabelas`, busca na tabela com maior prazo:
        - Usa `tabela.prazo` para encontrar maior prazo
        - Extrai `tabela.valorLiberado` da tabela encontrada

4. **Sincronização na Kentro**
   - Se oportunidade existe: **atualiza** com novo valor
   - Se não existe: **cria** nova oportunidade
   - **Move para stage 21** (aprovado)
   - **Atualiza campo `value`** com `valorLiberado`
   - Adiciona etiqueta 6 (se não existir)

5. **Cache**
   - Salva `oportunidadeId`
   - Salva `dadosCliente` formatados
   - Salva `resultadoKentro`

### Response de Sucesso
```json
{
  "success": true,
  "resultado": {
    "oportunidadeId": "789",
    "sincronizado": true,
    "dadosCliente": {
      "cpf": "16183805831",
      "nome": "João Silva",
      "valorLiberado": 6946.40,
      "dadosSimulacao": {
        "valorLiberado": 6946.40,
        "number_of_installments": 24
      }
    },
    "resultadoKentro": {
      "id": "789",
      "value": 6946.40,
      "fkStage": 21
    }
  }
}
```

### Código Principal
- **Arquivo**: `routes-clt-utf8.js` (linhas ~6692-6979)
- **Função**: `sincronizarOportunidadeKentro` em `utils/clt-fluxo.js`

---

## 🔧 Arquivos Principais

### Backend

1. **`routes-clt-utf8.js`** (ou `routes/clt.js` no servidor)
   - Contém todas as rotas das 5 fases
   - Endpoints: `/precencabank/teste/fase1-termo` até `/fase5-kentro`

2. **`utils/precencabank-fluxo.js`**
   - `gerarTermoINSS()`: Gera termo com retry de telefone
   - `consultarVinculos()`: Consulta vínculos empregatícios
   - `consultarMargem()`: Consulta margem disponível
   - `simularCredito()`: Executa simulação

3. **`utils/clt-fluxo.js`**
   - `sincronizarOportunidadeKentro()`: Sincroniza com Kentro
   - `atualizarOportunidadeKentro()`: Atualiza oportunidade
   - `criarOportunidadeKentroFila4()`: Cria nova oportunidade
   - `moverParaFase21()`: Move para stage 21

4. **`utils/cache-precencabank.js`**
   - `iniciarProcessamento()`: Inicia cache
   - `atualizarStatus()`: Atualiza status no cache
   - `buscarStatus()`: Busca status do cache
   - `salvarDadosMargem()`: Salva dados da margem
   - `buscarDadosMargem()`: Busca dados da margem

### Frontend

1. **`public/teste-fases-precencabank.html`**
   - Interface para testar as 5 fases
   - Botões para executar cada fase
   - Exibe resultados em tempo real

2. **`public/teste-fases-precencabank.js`**
   - `executarFase1()`: Executa Fase 1
   - `executarFase2()`: Executa Fase 2
   - `executarFase3()`: Executa Fase 3
   - `executarFase4()`: Executa Fase 4 (busca cache automaticamente)
   - `executarFase5()`: Executa Fase 5

---

## 🔄 Fluxo de Dados no Cache

```
Fase 1 → { termoId, shortUrl, url }
Fase 2 → { termoAssinado: true, urlAtual }
Fase 3 → { margem, dadosMargem, vinculo, matricula, cnpj }
Fase 4 → { simulacao: { valorLiberado, number_of_installments, tabelas } }
         + PRESERVA: { margem, dadosMargem, termoId, ... }
Fase 5 → { oportunidadeId, dadosCliente, resultadoKentro }
```

---

## ⚠️ Tratamento de Erros

### Fase 1: Telefone Já Utilizado
- **Erro detectado**: Status 400/409/422 com mensagem contendo "telefone"
- **Solução**: Gera telefone alternativo `119` + últimos 8 dígitos do CPF
- **Retry automático**: Sim, sem intervenção do usuário

### Fase 3: Termo Não Assinado
- **Erro**: "Termo precisa estar assinado"
- **Solução**: Executar Fase 2 primeiro

### Fase 4: Dados da Margem Não Encontrados
- **Erro**: "Dados da margem são obrigatórios"
- **Solução**: Executar Fase 3 primeiro

### Fase 5: Cliente Não Encontrado na Kentro
- **Erro**: "Cliente não encontrado na Kentro"
- **Solução**: Verificar se cliente existe nas filas 1, 3 ou 4

---

## 📊 Estrutura de Dados

### Cache Completo (após todas as fases)
```json
{
  "16183805831": {
    "cpf": "16183805831",
    "status": "PROCESSANDO",
    "etapa": "simulacao_concluida",
    "termoId": "123456",
    "shortUrl": "https://short.url/abc123",
    "termoAssinado": true,
    "margem": { ... },
    "dadosMargem": {
      "termoId": "123456",
      "matricula": "123456",
      "cnpj": "12345678000190"
    },
    "simulacao": {
      "valorLiberado": 6946.40,
      "number_of_installments": 24,
      "disbursement_amount": 6946.40,
      "operation_amount": 6946.40,
      "tabelas": [ ... ]
    },
    "oportunidadeId": "789",
    "dadosCliente": { ... }
  }
}
```

---

## ✅ Checklist de Funcionamento

- [x] Fase 1: Gera termo com retry automático de telefone
- [x] Fase 2: Verifica assinatura do termo
- [x] Fase 3: Consulta margem e salva no cache
- [x] Fase 4: Busca margem do cache, executa simulação, salva preservando dados anteriores
- [x] Fase 5: Extrai valor correto da simulação e envia para Kentro
- [x] Cache preserva dados entre fases
- [x] Valor correto enviado para Kentro (campo `value`)

---

## 🚀 Como Testar

1. Acesse: `http://seu-servidor:4000/teste-fases-precencabank.html`
2. Digite o CPF: `16183805831`
3. Execute as fases em sequência:
   - Fase 1 → Aguarde termo gerado
   - Fase 2 → Aguarde termo assinado
   - Fase 3 → Aguarde margem consultada
   - Fase 4 → Aguarde simulação concluída
   - Fase 5 → Aguarde sincronização com Kentro

---

## 📝 Notas Importantes

1. **Ordem das Fases**: Sempre execute em sequência (1 → 2 → 3 → 4 → 5)
2. **Cache do Servidor**: Dados são salvos no servidor, não apenas no frontend
3. **Preservação de Dados**: Fase 4 preserva dados anteriores ao salvar simulação
4. **Valor para Kentro**: Prioriza `valorLiberado` da simulação
5. **Prazo**: Usa campo `prazo` das tabelas para encontrar maior prazo

---

## 🔗 Links Úteis

- Interface de Teste: `/teste-fases-precencabank.html`
- Endpoint de Cache: `GET /clt/precencabank/teste/cache/:cpf`
- Logs: Verificar logs do PM2 no servidor

---

**Última atualização**: 18/11/2025
**Status**: ✅ Todas as fases funcionando corretamente
