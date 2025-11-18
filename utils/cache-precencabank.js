/**
 * Cache para dados do Presença Bank
 * Gerencia status de processamento, dados de margem, simulação, etc.
 */

// Cache em memória (pode ser substituído por Redis ou banco de dados)
const cache = new Map();
const dadosMargemCache = new Map();
const processando = new Set();

/**
 * Limpar CPF (remover caracteres não numéricos)
 */
const limparCPF = (cpf) => {
  if (!cpf) return null;
  return String(cpf).replace(/\D/g, '');
};

/**
 * Validar CPF (deve ter 11 dígitos)
 */
const validarCPF = (cpf) => {
  const cpfLimpo = limparCPF(cpf);
  return cpfLimpo && cpfLimpo.length === 11;
};

/**
 * Iniciar processamento de um CPF
 * @param {string} cpf - CPF do cliente
 * @param {object} dadosIniciais - Dados iniciais para o cache
 */
const iniciarProcessamento = (cpf, dadosIniciais = {}) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  const agora = new Date();
  
  // Inicializar cache se não existir
  if (!cache.has(cpfLimpo)) {
    cache.set(cpfLimpo, {
      cpf: cpfLimpo,
      status: 'PROCESSANDO',
      etapa: 'iniciado',
      inicioProcessamento: agora.toISOString(),
      ...dadosIniciais
    });
  }
  
  // Marcar como processando
  processando.add(cpfLimpo);
  
  console.log(`🔄 [CACHE] Processamento iniciado para CPF: ${cpfLimpo}`);
};

/**
 * Verificar se um CPF está sendo processado
 * @param {string} cpf - CPF do cliente
 * @returns {boolean}
 */
const estaProcessando = (cpf) => {
  const cpfLimpo = limparCPF(cpf);
  return processando.has(cpfLimpo);
};

/**
 * Atualizar status de processamento
 * @param {string} cpf - CPF do cliente
 * @param {string} status - Status ('PROCESSANDO', 'CONCLUIDO', 'ERRO')
 * @param {string} etapa - Etapa atual (ex: 'termo_gerado', 'margem_consultada', 'simulacao_concluida')
 * @param {object} dados - Dados adicionais para salvar no cache (será mesclado com dados existentes)
 */
const atualizarStatus = (cpf, status, etapa, dados = {}) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  // Buscar dados atuais do cache
  const dadosAtuais = cache.get(cpfLimpo) || {};
  
  // Mesclar dados existentes com novos dados (spread operator preserva dados anteriores)
  const dadosAtualizados = {
    ...dadosAtuais,
    ...dados,
    status: status || dadosAtuais.status || 'PROCESSANDO',
    etapa: etapa || dadosAtuais.etapa,
    ultimaAtualizacao: new Date().toISOString()
  };
  
  // Se status for CONCLUIDO ou ERRO, remover do set de processando
  if (status === 'CONCLUIDO' || status === 'ERRO') {
    processando.delete(cpfLimpo);
    dadosAtualizados.fimProcessamento = new Date().toISOString();
  }
  
  // Salvar no cache
  cache.set(cpfLimpo, dadosAtualizados);
  
  console.log(`💾 [CACHE] Status atualizado para CPF ${cpfLimpo}: ${status} - ${etapa}`);
  
  // Log detalhado dos dados salvos (apenas chaves principais)
  const chavesPrincipais = Object.keys(dados).filter(key => 
    !['timestamp', 'ultimaAtualizacao', 'inicioProcessamento', 'fimProcessamento'].includes(key)
  );
  if (chavesPrincipais.length > 0) {
    console.log(`📋 [CACHE] Dados salvos: ${chavesPrincipais.join(', ')}`);
  }
};

/**
 * Buscar status de processamento
 * @param {string} cpf - CPF do cliente
 * @returns {object} { success: boolean, dados: object, message?: string }
 */
const buscarStatus = (cpf) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    return {
      success: false,
      message: 'CPF inválido'
    };
  }
  
  const dados = cache.get(cpfLimpo);
  
  if (!dados) {
    return {
      success: false,
      message: 'Status não encontrado no cache'
    };
  }
  
  return {
    success: true,
    dados: dados
  };
};

/**
 * Salvar dados de margem
 * @param {string} cpf - CPF do cliente
 * @param {object} dadosMargem - Dados da margem (termoId, matricula, cnpj, termoAssinado, margem, etc.)
 */
const salvarDadosMargem = (cpf, dadosMargem) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  // Salvar em cache específico de margem
  dadosMargemCache.set(cpfLimpo, {
    ...dadosMargem,
    cpf: cpfLimpo,
    atualizadoEm: new Date().toISOString()
  });
  
  // Também atualizar no cache principal
  const dadosAtuais = cache.get(cpfLimpo) || {};
  cache.set(cpfLimpo, {
    ...dadosAtuais,
    ...dadosMargem,
    dadosMargem: dadosMargem // Manter referência completa
  });
  
  console.log(`💾 [CACHE] Dados de margem salvos para CPF: ${cpfLimpo}`);
};

/**
 * Buscar dados de margem
 * @param {string} cpf - CPF do cliente
 * @returns {object} { success: boolean, dados: object, message?: string }
 */
const buscarDadosMargem = (cpf) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    return {
      success: false,
      message: 'CPF inválido'
    };
  }
  
  // Tentar buscar do cache específico de margem primeiro
  const dadosMargem = dadosMargemCache.get(cpfLimpo);
  
  if (dadosMargem) {
    return {
      success: true,
      dados: dadosMargem
    };
  }
  
  // Tentar buscar do cache principal
  const dados = cache.get(cpfLimpo);
  
  if (dados && (dados.dadosMargem || dados.matricula || dados.cnpj || dados.margem)) {
    return {
      success: true,
      dados: dados.dadosMargem || dados
    };
  }
  
  return {
    success: false,
    message: 'Dados de margem não encontrados no cache'
  };
};

/**
 * Finalizar processamento (marcar como concluído)
 * @param {string} cpf - CPF do cliente
 * @param {object} resultado - Resultado do processamento
 */
const finalizarProcessamento = (cpf, resultado) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  atualizarStatus(cpfLimpo, 'CONCLUIDO', 'finalizado', {
    resultado: resultado
  });
  
  console.log(`✅ [CACHE] Processamento finalizado para CPF: ${cpfLimpo}`);
};

/**
 * Marcar erro no processamento
 * @param {string} cpf - CPF do cliente
 * @param {string} erro - Mensagem de erro
 * @param {string} etapa - Etapa onde ocorreu o erro
 */
const marcarErro = (cpf, erro, etapa = 'desconhecida') => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  atualizarStatus(cpfLimpo, 'ERRO', etapa, {
    erro: erro,
    erroEm: new Date().toISOString()
  });
  
  console.log(`❌ [CACHE] Erro marcado para CPF ${cpfLimpo} na etapa ${etapa}: ${erro}`);
};

/**
 * Limpar cache de um CPF (útil para testes)
 * @param {string} cpf - CPF do cliente
 */
const limparCache = (cpf) => {
  const cpfLimpo = limparCPF(cpf);
  
  if (!validarCPF(cpfLimpo)) {
    console.error(`❌ [CACHE] CPF inválido: ${cpf}`);
    return;
  }
  
  cache.delete(cpfLimpo);
  dadosMargemCache.delete(cpfLimpo);
  processando.delete(cpfLimpo);
  
  console.log(`🗑️ [CACHE] Cache limpo para CPF: ${cpfLimpo}`);
};

/**
 * Listar todos os CPFs em cache (útil para debug)
 * @returns {Array<string>} Lista de CPFs
 */
const listarCPFs = () => {
  return Array.from(cache.keys());
};

/**
 * Obter estatísticas do cache (útil para monitoramento)
 * @returns {object} Estatísticas do cache
 */
const obterEstatisticas = () => {
  return {
    totalCPFs: cache.size,
    processando: processando.size,
    dadosMargem: dadosMargemCache.size,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  iniciarProcessamento,
  estaProcessando,
  atualizarStatus,
  buscarStatus,
  salvarDadosMargem,
  buscarDadosMargem,
  finalizarProcessamento,
  marcarErro,
  limparCache,
  listarCPFs,
  obterEstatisticas
};
