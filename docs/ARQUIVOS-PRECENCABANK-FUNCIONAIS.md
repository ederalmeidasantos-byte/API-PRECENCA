# Arquivos Funcionais - Presença Bank

## ✅ Arquivos Testados e Funcionando

### Backend

1. **`routes-clt-utf8.js`** (ou `routes/clt.js` no servidor)
   - **Localização**: Raiz do projeto
   - **Função**: Contém todas as rotas das 5 fases
   - **Endpoints**:
     - `POST /clt/precencabank/teste/fase1-termo` (linhas ~6900-7055)
     - `POST /clt/precencabank/teste/fase2-assinar` (linhas ~7056-7079)
     - `POST /clt/precencabank/teste/fase3-margem` (linhas ~7067-7239)
     - `POST /clt/precencabank/teste/fase4-simulacao` (linhas ~7241-7576)
     - `POST /clt/precencabank/teste/fase5-kentro` (linhas ~6692-6979)
     - `GET /clt/precencabank/teste/cache/:cpf` (linhas ~6989-7065)
   - **Status**: ✅ Funcionando

2. **`utils/precencabank-fluxo.js`**
   - **Localização**: `utils/precencabank-fluxo.js`
   - **Funções principais**:
     - `gerarTermoINSS()`: Gera termo com retry automático de telefone
     - `consultarVinculos()`: Consulta vínculos empregatícios
     - `consultarMargem()`: Consulta margem disponível
     - `consultarTabelasDisponiveis()`: Consulta tabelas para simulação
     - `executarComRetry()`: Retry automático para erro 429
     - `formatarTelefone()`: Formata telefone para formato correto
   - **Status**: ✅ Funcionando

3. **`utils/clt-fluxo.js`**
   - **Localização**: `utils/clt-fluxo.js`
   - **Funções principais**:
     - `sincronizarOportunidadeKentro()`: Sincroniza com Kentro (linhas ~406-821)
     - `atualizarOportunidadeKentro()`: Atualiza oportunidade
     - `criarOportunidadeKentroFila4()`: Cria nova oportunidade
     - `moverParaFase21()`: Move para stage 21
   - **Status**: ✅ Funcionando (apenas função `sincronizarOportunidadeKentro` é usada)

4. **`utils/cache-precencabank.js`**
   - **Localização**: `utils/cache-precencabank.js` (no servidor)
   - **Funções principais**:
     - `iniciarProcessamento()`: Inicia cache
     - `atualizarStatus()`: Atualiza status no cache
     - `buscarStatus()`: Busca status do cache
     - `salvarDadosMargem()`: Salva dados da margem
     - `buscarDadosMargem()`: Busca dados da margem
   - **Status**: ✅ Funcionando (arquivo existe apenas no servidor)

### Frontend

1. **`public/teste-fases-precencabank.html`**
   - **Localização**: `public/teste-fases-precencabank.html`
   - **Função**: Interface web para testar as 5 fases
   - **Status**: ✅ Funcionando

2. **`public/teste-fases-precencabank.js`**
   - **Localização**: `public/teste-fases-precencabank.js`
   - **Funções principais**:
     - `executarFase1()`: Executa Fase 1
     - `executarFase2()`: Executa Fase 2
     - `executarFase3()`: Executa Fase 3
     - `executarFase4()`: Executa Fase 4 (busca cache automaticamente)
     - `executarFase5()`: Executa Fase 5
   - **Status**: ✅ Funcionando

### Documentação

1. **`docs/PRECENCABANK-FASES-1-5-COMPLETO.md`**
   - **Localização**: `docs/PRECENCABANK-FASES-1-5-COMPLETO.md`
   - **Conteúdo**: Documentação completa de todas as 5 fases
   - **Status**: ✅ Criado e enviado

---

## ❌ Arquivos NÃO Funcionais (NÃO enviar)

- `precencabank-lote.js` (raiz) - Versão antiga, não funcional
- `public/precencabank-lote.js` - Versão antiga
- `public/precencabank-lote.html` - Versão antiga
- `scripts/*` - Scripts de teste/deploy antigos
- `amb-ft-temp/*` - Arquivos temporários

---

## 📦 Estrutura de Arquivos no GitHub

```
API-PRECENCA/
├── docs/
│   └── PRECENCABANK-FASES-1-5-COMPLETO.md
├── public/
│   ├── teste-fases-precencabank.html
│   └── teste-fases-precencabank.js
├── utils/
│   ├── precencabank-fluxo.js
│   └── clt-fluxo.js (apenas função sincronizarOportunidadeKentro)
└── routes/
    └── clt.js (ou routes-clt-utf8.js na raiz)
```

---

## 🔧 Dependências

- `axios`: Para requisições HTTP
- `express`: Framework web
- `dotenv`: Gerenciamento de variáveis de ambiente
- `joi`: Validação de dados

---

## 📝 Notas

1. O arquivo `routes-clt-utf8.js` contém outras rotas além do Presença Bank. Apenas as rotas relacionadas ao Presença Bank devem ser consideradas funcionais.

2. O arquivo `utils/clt-fluxo.js` é grande e contém outras funções. Apenas `sincronizarOportunidadeKentro` é usada pelo Presença Bank.

3. O arquivo `utils/cache-precencabank.js` existe apenas no servidor e não está no repositório local.

---

**Última atualização**: 18/11/2025
