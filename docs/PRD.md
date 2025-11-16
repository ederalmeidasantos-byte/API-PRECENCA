# 📋 PRD - Product Requirements Document
## API Presença Bank - Sistema de Empréstimos Consignados CLT

---

## 🎯 Visão Geral do Produto

### Propósito
Desenvolver uma API robusta e escalável para integração com **Presença Bank**, automatizando completamente o processo de empréstimos consignados CLT, desde a solicitação do termo até a aprovação final no CRM Kentro.

### Problema que Resolve
- ✅ Eliminação de processos manuais em empréstimos consignados
- ✅ Redução de erros humanos em digitação e validação
- ✅ Aceleração do tempo de processamento (de horas para minutos)
- ✅ Centralização de dados entre múltiplos sistemas (Presença Bank + Kentro)
- ✅ Rastreamento completo do status de cada solicitação

### Usuários
- **Operadores de Crédito**: Solicitam empréstimos via interface web
- **Gestores**: Monitoram processamento e aprovações
- **Desenvolvedores**: Integram com outros sistemas
- **Suporte**: Diagnosticam problemas e verificam logs

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica
- **Backend**: Node.js 18.x + Express.js
- **Automação**: Puppeteer (navegador headless)
- **Banco de Dados**: Arquivo JSON (cache local)
- **CRM**: Kentro API (integração externa)
- **Banco**: Presença Bank API (integração externa)
- **Deploy**: PM2 + VPS Ubuntu 22.04
- **Monitoramento**: PM2 logs + Health checks

### Ambientes
| Ambiente | Porta | Finalidade | Status |
|----------|-------|------------|--------|
| **Teste** | 4000 | Desenvolvimento e testes | ✅ Ativo |
| **Teste HTTPS** | 4443 | Testes seguros | ✅ Ativo |
| **Produção** | 5000 | Operação real | ✅ Disponível |
| **Produção HTTPS** | 5443 | Operação segura | ✅ Disponível |
| **FGTS (Legado)** | 3006 | Sistema antigo | ✅ Ativo |

---

## ✨ Funcionalidades

### 🔵 FASE 1: Solicitar Termo
**Descrição**: Gera um termo de autorização INSS na Presença Bank.

**Input**:
- CPF do cliente (11 dígitos)

**Output**:
- ID do termo
- Token de assinatura
- URL para assinatura

**Regras de Negócio**:
- CPF deve ser válido (11 dígitos)
- Sistema deve buscar dados do cliente na Kentro
- Termo gerado é salvo em cache por 24 horas

**Tempo Estimado**: 2-3 segundos

---

### 🔵 FASE 2: Assinar Termo
**Descrição**: Assina o termo automaticamente usando automação de navegador.

**Input**:
- CPF do cliente
- ID do termo
- Token do termo

**Output**:
- Status da assinatura
- Data/hora da assinatura

**Regras de Negócio**:
- Usar Puppeteer headless em produção
- Timeout de 30 segundos
- Retry automático (máximo 2 tentativas)
- Validar se termo foi assinado com sucesso

**Tempo Estimado**: 5-10 segundos

**Tecnologia**: Puppeteer + Chromium

---

### 🔵 FASE 3: Consultar Margem
**Descrição**: Consulta a margem consignável disponível do trabalhador.

**Input**:
- CPF do cliente

**Output**:
- Valor da margem disponível
- Matrícula do funcionário
- CNPJ do empregador
- Data de admissão
- Dados pessoais (nome da mãe, data nascimento, etc)

**Regras de Negócio**:
- Termo deve estar assinado (Fase 2)
- Sistema extrai automaticamente matrícula e CNPJ
- Valida se trabalhador está elegível
- Cache resultado por 24 horas

**Tempo Estimado**: 3-5 segundos

**Integrações**:
- Presença Bank API (consulta margem)

---

### 🔵 FASE 4: Simulação
**Descrição**: Consulta tabelas de empréstimo com diferentes prazos e valores.

**Input**:
- CPF do cliente
- Dados da margem (da Fase 3)

**Output**:
- Lista de tabelas disponíveis
- Para cada tabela:
  - Prazo (meses)
  - Valor liberado
  - Valor da parcela
  - Taxa de juros
  - CET

**Regras de Negócio**:
- Margem deve estar consultada (Fase 3)
- Retornar apenas tabelas com valor dentro da margem
- Ordenar por prazo (maior primeiro)
- Cache resultado por 24 horas

**Tempo Estimado**: 2-3 segundos

---

### 🟣 FASE 5: Integração Kentro ⭐
**Descrição**: Integra a simulação aprovada no CRM Kentro (Fila 4, Fase 21 - Aprovado).

**Input**:
- CPF do cliente
- Tabela selecionada (da Fase 4)

**Output**:
- ID da oportunidade no Kentro
- Ação realizada (movida ou criada)
- Fase atual (21 - Aprovado)
- Valor atualizado

**Regras de Negócio**:
- **Se cliente já existe na Fila 4**:
  - Mover para Fase 21 (Aprovado)
  - Atualizar valor liberado
  - Atualizar prazo e taxa
- **Se cliente NÃO existe na Fila 4**:
  - Criar nova oportunidade
  - Colocar direto na Fase 21
  - Preencher todos os campos obrigatórios

**Campos Atualizados no Kentro**:
- `valor_liberado`: Valor aprovado
- `taxa_juros`: Taxa da tabela selecionada
- `prazo`: Prazo em meses
- `tabela_selecionada`: Nome da tabela
- `data_aprovacao`: Data/hora da aprovação

**Tempo Estimado**: 3-5 segundos

**Integrações**:
- Kentro CRM API (Fila 4, Fase 21)

---

### 🟢 FASE 6: Fluxo Completo ⭐
**Descrição**: Executa automaticamente as Fases 1, 2, 3 e 4 em sequência.

**Input**:
- CPF do cliente

**Output**:
- Resultado de cada fase
- Tempo total de execução
- Status final (sucesso ou erro)

**Regras de Negócio**:
- Executar fases sequencialmente
- Se alguma fase falhar, retornar erro com status parcial
- Delays entre fases:
  - Fase 1 → Fase 2: 2 segundos
  - Fase 2 → Fase 3: 2 segundos
  - Fase 3 → Fase 4: 2 segundos
- Salvar resultado de cada fase no cache

**Tempo Estimado**: 15-20 segundos

**Casos de Erro**:
- Retornar qual fase falhou
- Retornar resultado das fases concluídas
- Permitir retomar do ponto de falha

---

## 🔗 Integrações Externas

### Presença Bank API
**Base URL**: `https://api.precenca.bank/v1`

**Endpoints Utilizados**:
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/login` | POST | Obter token de autenticação |
| `/termos/clt` | POST | Solicitar termo |
| `/termos/{id}/assinar` | POST | Assinar termo |
| `/margem/consultar` | POST | Consultar margem |
| `/simulacao/tabelas` | POST | Consultar tabelas |

**Autenticação**:
- Bearer Token
- Validade: 1 hora
- Renovação automática implementada

**Rate Limiting**:
- Limite: não especificado
- Tratamento: Retry com exponential backoff
- Máximo de tentativas: 5

**Erros Comuns**:
- `401`: Token expirado (renovar automaticamente)
- `429`: Rate limit (aguardar e tentar novamente)
- `400`: Dados inválidos (validar input)

---

### Kentro CRM API
**Base URL**: `https://api.kentro.digital`

**Endpoints Utilizados**:
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/opportunities` | GET | Buscar oportunidade por CPF |
| `/api/opportunities/{id}` | GET | Obter detalhes da oportunidade |
| `/api/opportunities/{id}/move` | PUT | Mover para outra fase |
| `/api/opportunities` | POST | Criar nova oportunidade |

**Autenticação**:
- Bearer Token
- Sem expiração (token fixo)

**Fila 4 - CLT Consignado**:
| Fase | Nome | Descrição |
|------|------|-----------|
| 1 | Lead | Cliente em prospecção |
| 5 | Análise | Em análise de crédito |
| 15 | Aguardando Documentos | Pendente de documentação |
| **21** | **Aprovado** | ✅ **Aprovado pela Presença Bank** |
| 25 | Contratado | Contrato assinado |
| 30 | Liberado | Valor liberado |

**Campos FormsData Kentro**:
| Campo | ID | Descrição |
|-------|----|-----------| 
| CPF | `98011220` | CPF do cliente |
| Nome da Mãe | `917456f0` | Nome completo da mãe |
| Data Nascimento | `0bfc6250` | DD/MM/AAAA |
| Email | `9e7f92b0` | Email do cliente |
| Telefone | `98167d80` | Com código do país |
| CEP | `1836e090` | CEP do endereço |
| Rua | `1dbfcef0` | Nome da rua |
| Número | `6ac31450` | Número do endereço |
| Bairro | `3271f710` | Bairro |
| Cidade | `25178280` | Cidade |
| Estado | `f6384400` | UF (2 letras) |

---

## 🔐 Segurança

### Autenticação e Autorização
- ✅ Tokens armazenados em memória (não em disco)
- ✅ Renovação automática de tokens expirados
- ✅ HTTPS obrigatório em produção
- ✅ Rate limiting implementado

### Validação de Dados
- ✅ CPF: 11 dígitos obrigatório
- ✅ Sanitização de inputs
- ✅ Validação de campos obrigatórios
- ✅ Verificação de tipos de dados

### Cache
- ✅ Armazenamento local (JSON)
- ✅ Expiração automática (24 horas)
- ✅ Chaves únicas por CPF
- ✅ Limpeza automática de cache expirado

### Logs e Monitoramento
- ✅ Logs estruturados via PM2
- ✅ Separação de logs (out/error)
- ✅ Rotação automática de logs
- ✅ Health checks disponíveis

---

## 📊 Métricas e KPIs

### Performance
| Métrica | Meta | Atual |
|---------|------|-------|
| Tempo Fase 1 | < 5s | ~2-3s |
| Tempo Fase 2 | < 15s | ~5-10s |
| Tempo Fase 3 | < 10s | ~3-5s |
| Tempo Fase 4 | < 5s | ~2-3s |
| Tempo Fase 5 | < 10s | ~3-5s |
| Tempo Fluxo Completo | < 30s | ~15-20s |
| Taxa de Sucesso | > 95% | ~98% |

### Disponibilidade
- **Uptime**: > 99%
- **Health Check**: A cada 30 segundos
- **Restart Automático**: Via PM2

### Uso de Recursos
- **RAM**: < 500MB por instância
- **CPU**: < 50% médio
- **Disco**: < 1GB (logs + cache)

---

## 🧪 Testes

### Interface Web de Testes
**URL**: `http://72.60.159.149:4000/teste-fases-precencabank.html`

**Funcionalidades**:
- Testar cada fase individualmente
- Ver resultado em JSON formatado
- Cache automático de resultados
- Limpar cache por fase
- Alertas visuais de sucesso/erro

### CPFs de Teste
- `00949829021` - Cliente com margem ativa
- `12345678901` - Cliente exemplo

### Testes Automatizados
```bash
# Testar Health Check
curl http://72.60.159.149:4000/health

# Testar Fase 1
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase1-termo \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678901"}'

# Testar Fluxo Completo
curl -X POST http://72.60.159.149:4000/clt/precencabank/teste/fase6-fluxo-completo \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678901"}'
```

---

## 🚀 Roadmap

### Fase 1 - Implementação Base ✅
- [x] Integração com Presença Bank API
- [x] Sistema de autenticação e renovação de token
- [x] Fase 1: Solicitar Termo
- [x] Fase 2: Assinar Termo (Puppeteer)
- [x] Fase 3: Consultar Margem
- [x] Fase 4: Simulação

### Fase 2 - Integração Kentro ✅
- [x] Fase 5: Integração Kentro CRM
- [x] Mover oportunidade para Fase 21
- [x] Criar oportunidade automaticamente
- [x] Atualizar campos customizados

### Fase 3 - Automação Completa ✅
- [x] Fase 6: Fluxo Completo (1-4)
- [x] Sistema de cache inteligente
- [x] Tratamento de erros robusto
- [x] Interface web de testes

### Fase 4 - Melhorias (Em Progresso)
- [ ] Processamento em lote otimizado
- [ ] Fila de processamento (Redis/RabbitMQ)
- [ ] Webhook para notificações
- [ ] Dashboard de monitoramento
- [ ] Testes automatizados (Jest)

### Fase 5 - Produção
- [ ] Deploy em produção (porta 5000)
- [ ] Documentação API (Swagger)
- [ ] Treinamento de equipe
- [ ] SLA e suporte

---

## 📝 Requisitos Não Funcionais

### Escalabilidade
- Suportar até 100 processamentos simultâneos
- Processamento sequencial em lote (Puppeteer)
- Cache distribuído futuro

### Manutenibilidade
- Código modular e reutilizável
- Logs detalhados e estruturados
- Documentação atualizada
- Versionamento semântico

### Confiabilidade
- Retry automático em falhas
- Rollback de operações
- Backup de cache diário
- Monitoramento 24/7

### Performance
- Resposta < 30s para fluxo completo
- Cache hit ratio > 80%
- Throughput > 50 requisições/min

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Token Expirado (401)
**Sintoma**: Erro "Unauthorized" em requests
**Solução**: Sistema renova automaticamente. Se persistir, verificar credenciais.

#### 2. Rate Limit (429)
**Sintoma**: Erro "Too Many Requests"
**Solução**: Sistema aguarda automaticamente. Se frequente, revisar delays.

#### 3. Puppeteer Timeout
**Sintoma**: Erro após 30 segundos na Fase 2
**Solução**: 
- Verificar se Chrome está instalado
- Aumentar timeout se necessário
- Verificar logs: `pm2 logs clt-v8-api --err`

#### 4. Kentro Não Atualiza
**Sintoma**: Oportunidade não move para Fase 21
**Solução**:
- Verificar token Kentro válido
- Confirmar que oportunidade existe
- Verificar permissões na Fila 4

---

## 📞 Suporte

**Documentação**: https://github.com/ederalmeidasantos-byte/API-PRECENCA

**Logs**: `pm2 logs clt-v8-api`

**Health Check**: `http://72.60.159.149:4000/health`

**Interface de Testes**: `http://72.60.159.149:4000/teste-fases-precencabank.html`

---

**Desenvolvido por**: Equipe Lunas Digital  
**Última Atualização**: 16/11/2025  
**Versão**: 1.0.0
