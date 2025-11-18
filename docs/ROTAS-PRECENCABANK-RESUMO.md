# Rotas do Presença Bank - Resumo

## 📍 Localização das Rotas

As rotas do Presença Bank estão no arquivo `routes-clt-utf8.js` (ou `routes/clt.js` no servidor).

**Arquivo completo**: `routes-clt-utf8.js` (7588 linhas)
**Rotas do Presença Bank**: Linhas 6322-7584

---

## 🔗 Endpoints Disponíveis

### 1. FASE 1: Gerar Termo INSS
**Endpoint**: `POST /clt/precencabank/teste/fase1-termo`
**Linhas**: 6322-6588
**Função**: Gera termo INSS com retry automático de telefone

### 2. FASE 2: Assinar Termo
**Endpoint**: `POST /clt/precencabank/teste/fase2-assinatura`
**Linhas**: 6589-6691
**Função**: Assina termo usando Puppeteer

### 3. FASE 3: Consultar Margem
**Endpoint**: `POST /clt/precencabank/teste/fase3-margem`
**Linhas**: 7068-7239
**Função**: Consulta vínculos e margem disponível

### 4. FASE 4: Simulação
**Endpoint**: `POST /clt/precencabank/teste/fase4-simulacao`
**Linhas**: 7242-7584
**Função**: Executa simulação e extrai valor da tabela com maior prazo

### 5. FASE 5: Sincronizar com Kentro
**Endpoint**: `POST /clt/precencabank/teste/fase5-kentro`
**Linhas**: 6692-6987
**Função**: Busca oportunidade na Kentro e sincroniza com valor da simulação

### 6. Buscar Cache
**Endpoint**: `GET /clt/precencabank/teste/cache/:cpf`
**Linhas**: 6990-7065
**Função**: Retorna cache formatado do servidor

---

## 📝 Nota Importante

O arquivo `routes-clt-utf8.js` contém outras rotas além do Presença Bank. Para usar apenas as rotas do Presença Bank, você pode:

1. **Extrair apenas as rotas do Presença Bank** para um arquivo separado
2. **Usar o arquivo completo** e registrar apenas as rotas necessárias
3. **Manter o arquivo completo** e usar todas as rotas (recomendado)

---

## 🔧 Dependências das Rotas

- `utils/precencabank-fluxo.js`: Funções de integração com Presença Bank
- `utils/clt-fluxo.js`: Função `sincronizarOportunidadeKentro`
- `utils/cache-precencabank.js`: Gerenciamento de cache (existe apenas no servidor)

---

**Última atualização**: 18/11/2025
