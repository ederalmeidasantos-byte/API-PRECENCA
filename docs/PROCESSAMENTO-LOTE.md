# 🚀 PRECENÇABANK - Processamento em Lote

## ⚠️ IMPORTANTE - Controle de Recursos

### Por que processamento em lote pode ser perigoso?

1. **Puppeteer consome recursos**:
   - Cada browser aberto consome ~100-200MB de RAM
   - Processamento simultâneo pode sobrecarregar o VPS
   - Múltiplos processos podem travar o servidor

2. **Recomendações**:
   - ✅ **SEMPRE** processar sequencialmente (1 por vez)
   - ✅ **SEMPRE** usar modo headless em lote
   - ✅ **SEMPRE** adicionar delay entre processamentos
   - ✅ **SEMPRE** monitorar uso de recursos

## 📋 Configurações Padrão

```javascript
{
  maxConcorrencia: 1,              // Processamento sequencial (1 por vez)
  delayEntreProcessos: 2000,       // 2 segundos entre cada termo
  timeoutPorTermo: 60000,          // 60 segundos por termo
  usarHeadless: true,              // Sempre headless em lote
  maxRetries: 2                    // Máximo 2 tentativas
}
```

## 🎯 Como Usar

### Processamento Individual (Recomendado)
```javascript
// Processar um termo por vez
const { assinarTermoAutomaticamente } = require('./utils/precencabank-assinatura-automatica');

await assinarTermoAutomaticamente(urlAssinatura, {
  headless: true,  // Sempre true em produção
  timeout: 60000
});
```

### Processamento em Lote (Cuidado!)
```javascript
const { processarLoteTermos } = require('./utils/precencabank-assinatura-lote');

const termos = [
  { cpf: '12345678901', termoId: 'id1', urlAssinatura: 'https://...' },
  { cpf: '12345678902', termoId: 'id2', urlAssinatura: 'https://...' }
];

// Processa sequencialmente com delay
await processarLoteTermos(termos);
```

## 📊 Monitoramento

### Antes de processar em lote:
```bash
# Verificar uso de memória
free -h

# Verificar CPU
top

# Verificar processos Node
ps aux | grep node
```

### Durante processamento:
- Monitorar uso de RAM (não deve passar de 80%)
- Monitorar CPU (não deve ficar 100% por muito tempo)
- Verificar se há processos travados

## ⚙️ Configurações Recomendadas por Ambiente

### Desenvolvimento (Local)
```javascript
{
  maxConcorrencia: 1,
  delayEntreProcessos: 2000,  // 2 segundos
  timeoutPorTermo: 60000,
  usarHeadless: false  // Visual para debug
}
```

### Homologação
```javascript
{
  maxConcorrencia: 1,
  delayEntreProcessos: 3000,  // 3 segundos
  timeoutPorTermo: 60000,
  usarHeadless: true
}
```

### Produção
```javascript
{
  maxConcorrencia: 1,           // SEMPRE 1 em produção
  delayEntreProcessos: 5000,    // 5 segundos (mais seguro)
  timeoutPorTermo: 60000,
  usarHeadless: true,           // SEMPRE true
  maxRetries: 2
}
```

## 🚨 Limites Recomendados

### VPS com 2GB RAM:
- Máximo: 5 termos por vez (sequencial)
- Delay mínimo: 5 segundos

### VPS com 4GB RAM:
- Máximo: 10 termos por vez (sequencial)
- Delay mínimo: 3 segundos

### VPS com 8GB+ RAM:
- Máximo: 20 termos por vez (sequencial)
- Delay mínimo: 2 segundos

## 🔄 Alternativas para Processamento em Lote

### Opção 1: Processar em Background (Recomendado)
```javascript
// Adicionar à fila e processar em background
const { adicionarTermoFila } = require('./utils/precencabank-assinatura-lote');

termos.forEach(termo => {
  adicionarTermoFila(termo.urlAssinatura, termo.termoId, termo.cpf);
});

// Processamento acontece em background automaticamente
```

### Opção 2: Processar em Lotes Pequenos
```javascript
// Processar de 5 em 5
const lotes = [];
for (let i = 0; i < termos.length; i += 5) {
  lotes.push(termos.slice(i, i + 5));
}

for (const lote of lotes) {
  await processarLoteTermos(lote);
  // Aguardar 30 segundos entre lotes
  await new Promise(resolve => setTimeout(resolve, 30000));
}
```

### Opção 3: Usar Queue System (RabbitMQ, Redis)
Para volumes muito grandes, considere usar um sistema de filas externo.

## ✅ Checklist Antes de Processar em Lote

- [ ] Verificar memória disponível (> 1GB livre)
- [ ] Verificar CPU disponível (< 50% em uso)
- [ ] Configurar delay adequado (mínimo 2-3 segundos)
- [ ] Usar modo headless (true)
- [ ] Limitar quantidade (começar com 5-10)
- [ ] Testar com pequena quantidade primeiro
- [ ] Monitorar durante processamento
- [ ] Ter plano de rollback se necessário

## 📝 Exemplo de Uso Seguro

```javascript
const { gerarTermoINSS } = require('./utils/precencabank-fluxo');
const { processarLoteTermos } = require('./utils/precencabank-assinatura-lote');

// 1. Gerar termos (sem assinar ainda)
const termos = [];
for (const cpf of cpfs) {
  const termo = await gerarTermoINSS({ cpf, nome, telefone, produtoId: 28 });
  termos.push({
    cpf,
    termoId: termo.id,
    urlAssinatura: termo.shortUrl
  });
  
  // Delay entre geração
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 2. Processar assinaturas em lote (sequencial)
await processarLoteTermos(termos);
```

## 🚨 Sinais de Problema

Se durante processamento você notar:
- ✅ Memória acima de 80% → **PARAR** e aumentar delay
- ✅ CPU 100% por mais de 30s → **PARAR** e reduzir quantidade
- ✅ Processos travados → **RESTART** do serviço
- ✅ VPS lento/resposta → **PARAR** imediatamente
