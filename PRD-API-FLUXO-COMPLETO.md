# PRD - API Fluxo Completo Presença Bank

## 📋 Informações Gerais

**Versão:** 1.0.0  
**Data:** 19/11/2025  
**Autor:** Sistema Presença Bank  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Criar uma API REST que execute o fluxo completo do Presença Bank (4 fases) de forma síncrona, retornando resultado completo mesmo em caso de erro, seguindo o mesmo padrão da API V8 (`/clt/fluxo-completo`).

---

## 📊 Requisitos Funcionais

### RF01: Endpoint de Fluxo Completo
- **Descrição:** Criar endpoint POST `/precencabank/fluxo-completo` que execute as 4 fases do Presença Bank
- **Prioridade:** Alta
- **Status:** ✅ Implementado

### RF02: Execução das 4 Fases
A API deve executar sequencialmente:

1. **Fase 1: Gerar Termo**
   - Buscar dados do cliente na Kentro (filas 1, 3 e 4)
   - Validar dados obrigatórios
   - Gerar termo INSS via `gerarTermoINSS`
   - Retornar `termoId` e `termoUrl`

2. **Fase 2: Assinar Termo**
   - Assinar termo automaticamente via `assinarTermoAutomaticamente`
   - Confirmar assinatura

3. **Fase 3: Consultar Margem**
   - Consultar vínculos via `consultarVinculos`
   - Extrair matrícula e CNPJ
   - Consultar margem via `consultarMargem`

4. **Fase 4: Simulação**
   - Consultar tabelas disponíveis via `consultarTabelasDisponiveis`
   - Extrair valor liberado da tabela com maior prazo
   - Retornar dados completos da simulação

### RF03: Retorno de Resultado Completo
- **Descrição:** A API deve retornar o objeto `resultado` completo mesmo quando houver erro
- **Formato:** Igual à API V8 (`/clt/fluxo-completo`)
- **Campos obrigatórios no resultado:**
  - `sucesso`: boolean
  - `cpf`: string
  - `erro`: string (se houver)
  - `etapa`: string (fase onde ocorreu erro, se houver)
  - `termo_resultado`: object (dados da fase 1, mesmo com erro)
  - `assinatura_resultado`: object (dados da fase 2, mesmo com erro)
  - `margem_resultado`: object (dados da fase 3, mesmo com erro)
  - `simulacao_resultado`: object (dados da fase 4, mesmo com erro)
  - `dados_validados`: object (dados do cliente da Kentro)

### RF04: Tratamento de Erros
- **Descrição:** Retornar erro estruturado com resultado parcial
- **Formato de resposta de erro:**
```json
{
  "success": false,
  "origem": "PRECENÇABANK",
  "error": "mensagem de erro",
  "etapa": "faseX_...",
  "resultado": {
    "sucesso": false,
    "cpf": "...",
    "erro": "...",
    "etapa": "...",
    "termo_resultado": {...},
    "assinatura_resultado": {...},
    "margem_resultado": {...},
    "simulacao_resultado": {...},
    "dados_validados": {...}
  },
  "timestamp": "..."
}
```

### RF05: Parâmetros de Entrada
- **CPF:** Obrigatório (11 dígitos)
- **Valor:** Não utilizado (removido)
- **Prazo:** Não utilizado (removido)

---

## 🔧 Requisitos Técnicos

### RT01: Endpoint
- **Método:** POST
- **URL:** `/precencabank/fluxo-completo`
- **URL Alternativa:** `/clt/precencabank/fluxo-completo` (com prefixo /clt)
- **Content-Type:** `application/json`

### RT02: Integração com Kentro
- Buscar oportunidade nas filas 1, 3 e 4
- Validar dados obrigatórios antes de iniciar
- Usar funções do módulo `clt-fluxo.mjs`

### RT03: Cache
- Salvar dados no cache do servidor após cada fase
- Usar funções: `iniciarProcessamento`, `atualizarStatus`

### RT04: Logs
- Registrar logs detalhados de cada fase
- Formato: `📋 [CPF] FASE X: ...`
- Logs de sucesso: `✅ [CPF] FASE X concluída`
- Logs de erro: `❌ [CPF] ERRO NA FASE X`

---

## 📝 Especificação da API

### Request

**Endpoint:**
```
POST /precencabank/fluxo-completo
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "cpf": "08037428940"
}
```

### Response - Sucesso (200)

```json
{
  "success": true,
  "message": "Fluxo Presença Bank executado com sucesso",
  "origem": "PRECENÇABANK",
  "resultado": {
    "sucesso": true,
    "cpf": "08037428940",
    "termo_resultado": {
      "id": "uuid-do-termo",
      "shortUrl": "https://sign.presen.ca/XXXXX",
      "url": "https://sign.presen.ca/XXXXX",
      "autorizacaoId": "uuid-do-termo"
    },
    "assinatura_resultado": {
      "success": true,
      "urlAtual": "https://sign.presen.ca/inss/termo/XXXXX/finalizado",
      "message": "Termo assinado com sucesso"
    },
    "margem_resultado": {
      "margem": {
        "numeroInscricaoEmpregador": "...",
        "valorMargem": 1299.6,
        "matricula": "...",
        "dataAdmissao": "...",
        "dataNascimento": "...",
        "valorMargemAvaliavel": 1299.6,
        "valorBaseMargem": 3713.15,
        "valorTotalVencimentos": 25420.78,
        "nomeMae": "...",
        "sexo": "Masculino"
      },
      "vinculo": {...},
      "matricula": "...",
      "cnpj": "..."
    },
    "simulacao_resultado": {
      "disbursement_amount": 6946.4,
      "operation_amount": 6946.4,
      "number_of_installments": 24,
      "valorMaximo": 6946.4,
      "valorLiberado": 6946.4,
      "valor": 6946.4,
      "tabelas": [...]
    },
    "dados_validados": {
      "nome": "...",
      "telefone": "...",
      "email": "...",
      "cpf": "08037428940",
      "data_nascimento": "...",
      "nome_mae": "...",
      "sexo": "M",
      "endereco": {...},
      "dados_bancarios": {...}
    }
  },
  "timestamp": "2025-11-19T01:00:00.000Z"
}
```

### Response - Erro (400/404/500)

```json
{
  "success": false,
  "origem": "PRECENÇABANK",
  "error": "mensagem de erro detalhada",
  "etapa": "fase4_simulacao",
  "resultado": {
    "sucesso": false,
    "cpf": "08037428940",
    "erro": "mensagem de erro detalhada",
    "etapa": "fase4_simulacao",
    "termo_resultado": {
      "id": "uuid-do-termo",
      "shortUrl": "https://sign.presen.ca/XXXXX",
      "url": "https://sign.presen.ca/XXXXX",
      "autorizacaoId": "uuid-do-termo"
    },
    "assinatura_resultado": {
      "success": true,
      "urlAtual": "https://sign.presen.ca/inss/termo/XXXXX/finalizado",
      "message": "Termo assinado com sucesso"
    },
    "margem_resultado": {
      "margem": {...},
      "vinculo": {...},
      "matricula": "...",
      "cnpj": "..."
    },
    "simulacao_resultado": null,
    "dados_validados": {
      "nome": "...",
      "telefone": "...",
      "email": "...",
      "cpf": "08037428940",
      "data_nascimento": "...",
      "nome_mae": "...",
      "sexo": "M",
      "endereco": {...},
      "dados_bancarios": {...}
    }
  },
  "timestamp": "2025-11-19T01:00:00.000Z"
}
```

---

## 🔍 Códigos de Status HTTP

- **200:** Sucesso - Fluxo executado com sucesso
- **400:** Erro de validação (CPF inválido, dados faltantes, etc.)
- **404:** Cliente não encontrado na Kentro ou vínculos não encontrados
- **500:** Erro interno do servidor ou erro em alguma fase

---

## 📦 Dependências

### Módulos Utilizados
- `express` - Framework web
- `axios` - Cliente HTTP
- `clt-fluxo.mjs` - Funções de integração com Kentro
- `precencabank-fluxo.js` - Funções do Presença Bank
- `precencabank-assinatura-automatica-otimizada.js` - Assinatura automática
- `cache-precencabank.js` - Gerenciamento de cache

### Funções Importadas
- `gerarTermoINSS` - Gerar termo INSS
- `assinarTermoAutomaticamente` - Assinar termo
- `consultarVinculos` - Consultar vínculos
- `consultarMargem` - Consultar margem
- `consultarTabelasDisponiveis` - Consultar tabelas (simulação)
- `buscarOportunidadeKentro` - Buscar cliente na Kentro
- `validarDadosOportunidade` - Validar dados
- `formatarDataNascimento` - Formatar data
- `iniciarProcessamento` - Iniciar cache
- `atualizarStatus` - Atualizar cache

---

## 🧪 Casos de Teste

### CT01: Fluxo Completo com Sucesso
- **Input:** `{"cpf": "16183805831"}`
- **Resultado Esperado:** Status 200, `resultado.sucesso = true`, todas as 4 fases completas

### CT02: Erro na Fase 1 (Gerar Termo)
- **Input:** CPF válido mas com erro na geração do termo
- **Resultado Esperado:** Status 500, `resultado.sucesso = false`, `resultado.etapa = "fase1_termo"`, `resultado.termo_resultado` com dados parciais

### CT03: Erro na Fase 2 (Assinar Termo)
- **Input:** CPF válido, termo gerado mas erro na assinatura
- **Resultado Esperado:** Status 500, `resultado.sucesso = false`, `resultado.etapa = "fase2_assinatura"`, `resultado.termo_resultado` e `resultado.assinatura_resultado` com dados parciais

### CT04: Erro na Fase 3 (Consultar Margem)
- **Input:** CPF válido, termo assinado mas erro ao consultar margem
- **Resultado Esperado:** Status 404/500, `resultado.sucesso = false`, `resultado.etapa = "fase3_margem"`, dados parciais das fases 1 e 2

### CT05: Erro na Fase 4 (Simulação)
- **Input:** `{"cpf": "08037428940"}` (CPF com margem negativa)
- **Resultado Esperado:** Status 400, `resultado.sucesso = false`, `resultado.etapa = "fase4_simulacao"`, todas as fases anteriores completas

### CT06: Cliente Não Encontrado na Kentro
- **Input:** CPF que não existe na Kentro
- **Resultado Esperado:** Status 404, `resultado.sucesso = false`, `resultado.etapa = "buscar_kentro"`

### CT07: Dados Incompletos na Kentro
- **Input:** CPF encontrado mas com dados obrigatórios faltantes
- **Resultado Esperado:** Status 400, `resultado.sucesso = false`, `resultado.etapa = "validar_dados"`, `resultado.dadosFaltantes` com lista

### CT08: CPF Inválido
- **Input:** `{"cpf": "123"}`
- **Resultado Esperado:** Status 400, mensagem "CPF inválido"

---

## 🔄 Fluxo de Execução

```
1. Receber requisição POST
   ↓
2. Validar CPF (11 dígitos)
   ↓
3. Inicializar objeto resultado
   ↓
4. Carregar módulo clt-fluxo
   ↓
5. Buscar cliente na Kentro (filas 1, 3, 4)
   ↓
6. Validar dados obrigatórios
   ↓
7. Preparar dados do cliente
   ↓
8. FASE 1: Gerar Termo
   ├─ Sucesso → Continuar
   └─ Erro → Retornar resultado parcial
   ↓
9. FASE 2: Assinar Termo
   ├─ Sucesso → Continuar
   └─ Erro → Retornar resultado parcial
   ↓
10. FASE 3: Consultar Vínculos e Margem
    ├─ Sucesso → Continuar
    └─ Erro → Retornar resultado parcial
    ↓
11. FASE 4: Simulação
    ├─ Sucesso → Retornar resultado completo
    └─ Erro → Retornar resultado parcial
    ↓
12. Salvar no cache
    ↓
13. Retornar resposta
```

---

## 📊 Comparação com API V8

| Aspecto | V8 (`/clt/fluxo-completo`) | Presença Bank (`/precencabank/fluxo-completo`) |
|---------|---------------------------|------------------------------------------------|
| **Método** | POST | POST |
| **Parâmetros** | `cpf`, `valor`, `prazo`, `forcarNovoTermo` | `cpf` (apenas) |
| **Fases** | Buscar → Validar → Solicitar Termo | Gerar Termo → Assinar → Margem → Simulação |
| **Retorno de Erro** | `resultado` completo | `resultado` completo |
| **Formato** | `{success, origem, error, etapa, resultado}` | `{success, origem, error, etapa, resultado}` |
| **Cache** | Sim | Sim |

---

## 🚀 Exemplo de Uso

### cURL
```bash
curl -X POST http://72.60.159.149:4000/precencabank/fluxo-completo \
  -H 'Content-Type: application/json' \
  -d '{"cpf": "16183805831"}'
```

### JavaScript (fetch)
```javascript
const response = await fetch('http://72.60.159.149:4000/precencabank/fluxo-completo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cpf: '16183805831'
  })
});

const data = await response.json();
console.log(data);
```

### Python (requests)
```python
import requests

response = requests.post(
    'http://72.60.159.149:4000/precencabank/fluxo-completo',
    json={'cpf': '16183805831'},
    headers={'Content-Type': 'application/json'}
)

data = response.json()
print(data)
```

---

## 📁 Localização do Código

**Arquivo:** `/opt/lunas-digital/rota-4000.teste/presençabank/routes/precencabank.js`  
**Linha:** 1341  
**Função:** `router.post('/precencabank/fluxo-completo', async (req, res) => {`

---

## ✅ Checklist de Implementação

- [x] Endpoint criado
- [x] Validação de CPF
- [x] Busca na Kentro (filas 1, 3, 4)
- [x] Validação de dados
- [x] Fase 1: Gerar Termo
- [x] Fase 2: Assinar Termo
- [x] Fase 3: Consultar Margem
- [x] Fase 4: Simulação
- [x] Retorno de resultado completo (mesmo com erro)
- [x] Tratamento de erros por fase
- [x] Salvar no cache
- [x] Logs detalhados
- [x] Formato igual à V8

---

## 📝 Notas Técnicas

1. **Objeto Resultado:** Sempre inicializado no início da função, mesmo em caso de erro
2. **Try/Catch por Fase:** Cada fase tem seu próprio try/catch para capturar erros específicos
3. **Dados Parciais:** Mesmo com erro, retorna dados das fases anteriores executadas com sucesso
4. **Cache:** Dados são salvos no cache após cada fase bem-sucedida
5. **Compatibilidade:** Endpoint disponível com e sem prefixo `/clt`

---

## 🔐 Segurança

- Validação de CPF (11 dígitos numéricos)
- Sanitização de entrada
- Tratamento de erros sem expor informações sensíveis
- Logs sem dados sensíveis

---

## 📈 Métricas e Monitoramento

- Tempo de execução por fase
- Taxa de sucesso/erro por fase
- Logs estruturados para análise
- Cache para evitar reprocessamento

---

## 🔄 Versões

### v1.0.0 (19/11/2025)
- ✅ Implementação inicial
- ✅ 4 fases completas
- ✅ Retorno de resultado completo (igual V8)
- ✅ Tratamento de erros estruturado

---

## 📞 Suporte

Para dúvidas ou problemas, verificar:
- Logs: `/opt/lunas-digital/rota-4000.teste/presençabank/logs/`
- Cache: `/opt/lunas-digital/rota-4000.teste/presençabank/data/cache/`
- Documentação: `/opt/lunas-digital/rota-4000.teste/presençabank/README.md`

---

**Documento criado em:** 19/11/2025  
**Última atualização:** 19/11/2025  
**Status:** ✅ Implementado e Funcional
