# Mapeamento de Campos: Kentro → PrecençaBank

## 📋 Mapeamento de Campos do FormsData da Kentro

### IDs dos Campos no FormsData

| Campo PrecençaBank | ID FormsData Kentro | Exemplo | Observações |
|---|---|---|---|
| **CPF** | `98011220` | `03647074969` | Também em `mainmail` |
| **Nome da Mãe** | `917456f0` | `SELESIA WATERKEMPER WESSLER` | |
| **Data Nascimento** | `0bfc6250` | `15/06/1983` | Formato DD/MM/AAAA |
| **Email** | `9e7f92b0` | `consulta@gmail.com.br` | |
| **Telefone** | `98167d80` | `5573988049212` | Também em `mainphone` |
| **RG** | `6a93f650` | `0535915187` | |
| **CEP** | `1836e090` | `45650080` | Pode estar na descrição também |
| **Rua** | `1dbfcef0` | `Rua Avelino Fernandes` | |
| **Número** | `6ac31450` | `89` | Pode estar null, extrair da descrição |
| **Bairro** | `3271f710` | `Conquista` | |
| **Cidade** | `25178280` | `Ilhéus` | |
| **Estado** | `f6384400` | `BA` | |

### Campos Diretos da Oportunidade Kentro

| Campo PrecençaBank | Campo Kentro | Exemplo |
|---|---|---|
| **CPF** | `mainmail` | `03647074969` |
| **Nome** | `title` | `Charles Wessler` |
| **Telefone** | `mainphone` | `5573988049212` |
| **Descrição** | `description` | Contém dados adicionais |

### Extração da Descrição

A descrição pode conter dados quando os campos formsdata estão null:

```
DADOS ENVIADOS

CPF: 03647074969
Nome da mãe: SELESIA WATERKEMPER WESSLER
RG: 0535915187
Data Nascimento: 15/06/1983
Celular: null
E-mail: consulta@gmail.com.br
Cep: 45650080
Rua: Rua Avelino Fernandes
Número: 89
Bairro: Conquista
Estado: Ilhéus

Dados Bancários:
BANCO: null
AGENCIA: null
CONTA: null.
```

**Regex para extração:**
- Número: `/N[úu]mero:\s*(\d+)/i`
- CEP: `/Cep:\s*(\d{5}-?\d{3})/i`

## 🔄 Formatação de Dados

### Data de Nascimento
- **Entrada**: `15/06/1983` (DD/MM/AAAA)
- **Saída**: `1983-06-15` (AAAA-MM-DD)

### Telefone
- **Entrada**: `5573988049212` (com código do país)
- **Processamento**: Remover código do país se começar com `55`
- **Formato final**: `{ ddd: "73", numero: "988049212" }`

### CPF
- **Entrada**: `03647074969` (com ou sem formatação)
- **Processamento**: Remover caracteres não numéricos
- **Saída**: `03647074969`

## 📊 Estrutura Completa do Payload PrecençaBank

```json
{
  "type": "credito-privado-v3",
  "tomador": {
    "telefone": {
      "ddd": "73",
      "numero": "988049212"
    },
    "cpf": "03647074969",
    "nome": "Charles Wessler",
    "dataNascimento": "1983-06-15",
    "nomeMae": "SELESIA WATERKEMPER WESSLER",
    "email": "consulta@gmail.com.br",
    "sexo": "M",
    "vinculoEmpregaticio": {
      "cnpjEmpregador": "83247338000170",
      "registroEmpregaticio": "4"
    },
    "dadosBancarios": {
      "codigoBanco": "001",
      "agencia": "0001",
      "conta": "12345",
      "digitoConta": "0",
      "formaCredito": "2"
    },
    "endereco": {
      "cep": "45650080",
      "rua": "Rua Avelino Fernandes",
      "numero": "89",
      "complemento": "",
      "cidade": "Ilhéus",
      "estado": "BA",
      "bairro": "Conquista"
    }
  },
  "proposta": {
    "valorSolicitado": 0,
    "quantidadeParcelas": 24,
    "produtoId": 28,
    "valorParcela": 682.01,
    "tabelaId": 5166
  },
  "documentos": []
}
```

## ✅ Validações Obrigatórias

### Campos Obrigatórios para Criar Operação

1. **Endereço** (todos obrigatórios):
   - ✅ CEP
   - ✅ Rua
   - ✅ Número
   - ✅ Bairro
   - ✅ Cidade
   - ✅ Estado

2. **Dados Pessoais**:
   - ✅ CPF
   - ✅ Nome
   - ✅ Telefone
   - ✅ Data Nascimento
   - ✅ Nome da Mãe
   - ✅ Email
   - ✅ Sexo

3. **Vínculo Empregatício**:
   - ✅ CNPJ Empregador
   - ✅ Registro Empregatício (Matrícula)

4. **Proposta**:
   - ✅ Produto ID (28 para CLT)
   - ✅ Quantidade Parcelas
   - ✅ Valor Parcela (não pode ser 0)
   - ✅ Tabela ID

## 🎯 Exemplo de Uso

```javascript
const dadosMapeados = mapearDadosKentroParaPrecencabank(
  oportunidadeKentro,
  {
    matricula: '4',
    cnpj: '83247338000170'
  },
  5166 // tabelaId
);

const operacao = await criarOperacao(dadosMapeados);
// Retorna: { id: 548758 }
```

## 📝 Notas Importantes

1. **Valor Parcela**: Não pode ser 0 na consulta de tabelas, use um valor válido (ex: 745.40)
2. **Número do Endereço**: Se null no formsdata, tentar extrair da descrição
3. **CEP**: Se null no formsdata, tentar extrair da descrição
4. **Dados Bancários**: Se não disponíveis na Kentro, usar valores padrão
5. **Estado**: A descrição pode ter "Estado: Ilhéus" mas o formsdata tem "BA" - usar formsdata primeiro

## 🔍 Teste Realizado

- **CPF**: `03647074969`
- **Nome**: `Charles Wessler`
- **Operação ID Criada**: `548758`
- **Status**: ✅ Sucesso
