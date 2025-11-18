// BACKUP - Fase 1 Termo (Versão Simplificada - Refatorada)
// Data: 2025-01-XX
// Descrição: Versão simplificada da Fase 1 com tratamento de erro de telefone melhorado

router.post('/precencabank/teste/fase1-termo', async (req, res) => {
  try {
    const { cpf } = req.body;
    
    if (!cpf) {
      return res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      });
    }
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido (deve ter 11 dígitos)'
      });
    }
    
    console.log(`🧪 [TESTE] Fase 1 - Gerando termo para CPF: ${cpfLimpo}`);
    
    // Carregar módulo clt-fluxo antes de usar as funções
    await carregarCltFluxo();
    
    // Buscar dados do cliente na Kentro usando a mesma lógica do precencabank-lote
    // Primeiro tentar buscarOportunidadeKentro (busca em múltiplas filas)
    let oportunidade = await buscarOportunidadeKentro(cpfLimpo);
    
    // Se não encontrou, buscar especificamente na fila 4 usando a mesma lógica do buscarClientesFila4
    if (!oportunidade) {
      console.log(`🔍 [TESTE] [${cpfLimpo}] Não encontrado com buscarOportunidadeKentro, tentando buscar na Fila 4...`);
      
      try {
        const url = `${process.env.KENTRO_API_URL}/getPipeOpportunities`;
        const requestData = {
          queueId: parseInt(process.env.KENTRO_QUEUE_ID),
          apiKey: process.env.KENTRO_API_KEY,
          pipelineId: 4 // Fila 4
        };
        
        const axios = require('axios');
        const response = await axios.post(url, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'CLT-V8-API/1.0.0'
          },
          timeout: 30000
        });
        
        // A API pode retornar em diferentes formatos
        let oportunidades = [];
        if (Array.isArray(response.data)) {
          oportunidades = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          oportunidades = response.data.data;
        } else if (response.data?.opportunities && Array.isArray(response.data.opportunities)) {
          oportunidades = response.data.opportunities;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          oportunidades = response.data.results;
        }
        
        // Buscar CPF em múltiplos lugares (mesma lógica do buscarClientesFila4)
        oportunidade = oportunidades.find(opp => {
          const cpfOportunidade = opp.mainmail || 
                                  opp.formsdata?.['98011220'] || 
                                  opp.formsdata?.cpf || 
                                  opp.cpf || 
                                  '';
          return cpfOportunidade === cpfLimpo || cpfOportunidade.replace(/\D/g, '') === cpfLimpo;
        });
        
        if (oportunidade) {
          console.log(`✅ [TESTE] [${cpfLimpo}] Oportunidade encontrada na Fila 4: ID ${oportunidade.id}`);
        } else {
          console.log(`❌ [TESTE] [${cpfLimpo}] Oportunidade não encontrada na Fila 4`);
        }
      } catch (error) {
        console.error(`❌ [TESTE] [${cpfLimpo}] Erro ao buscar na Fila 4:`, error.message);
      }
    }
    
    if (!oportunidade) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado na Kentro (buscado em filas 1, 3 e 4)'
      });
    }
    
    const validacao = validarDadosOportunidade(oportunidade);
    if (!validacao.valido) {
      return res.status(400).json({
        success: false,
        error: `Dados obrigatórios não preenchidos: ${validacao.dadosFaltantes.join(', ')}`
      });
    }
    
    console.log(`✅ [TESTE] [${cpfLimpo}] Fase 1 - Validação OK, dados válidos`);
    console.log(`✅ [TESTE] [${cpfLimpo}] Fase 1 - Telefone do cliente: ${validacao.dados.telefone}`);
    
    // Gerar termo - com tratamento para erro de telefone já utilizado
    let termo = null;
    let telefoneUsado = validacao.dados.telefone;
    
    // Função auxiliar para detectar erro de telefone
    const isErroTelefone = (error) => {
      if (!error) return false;
      
      const errorMessage = (error.message || '').toLowerCase();
      const errorResponse = error.response?.data;
      const statusCode = error.response?.status;
      
      // Verificar na mensagem
      if (errorMessage.includes('telefone') && errorMessage.includes('já')) {
        return true;
      }
      
      // Verificar no array de erros
      if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
        const temErroTelefone = errorResponse.errors.some(err => {
          const errStr = String(err).toLowerCase();
          return errStr.includes('telefone') && errStr.includes('já');
        });
        if (temErroTelefone) return true;
      }
      
      // Verificar em toda a resposta
      if (errorResponse) {
        const responseStr = JSON.stringify(errorResponse).toLowerCase();
        if (responseStr.includes('telefone') && responseStr.includes('já')) {
          return true;
        }
      }
      
      // Se for status 400/409/422 e mencionar telefone
      if ((statusCode === 400 || statusCode === 409 || statusCode === 422) && 
          (errorMessage.includes('telefone') || JSON.stringify(errorResponse || {}).toLowerCase().includes('telefone'))) {
        return true;
      }
      
      return false;
    };
    
    // Tentar gerar termo com telefone original
    try {
      console.log(`🔄 [TESTE] [${cpfLimpo}] Fase 1 - Tentando gerar termo com telefone original: ${telefoneUsado}`);
      termo = await gerarTermoINSS({
        cpf: cpfLimpo,
        nome: validacao.dados.nome,
        telefone: telefoneUsado,
        produtoId: 28
      });
      console.log(`✅ [TESTE] [${cpfLimpo}] Fase 1 - Termo gerado com sucesso usando telefone original`);
    } catch (errorTelefone) {
      console.log(`⚠️ [TESTE] [${cpfLimpo}] Fase 1 - Erro ao gerar termo com telefone original`);
      console.log(`⚠️ [TESTE] [${cpfLimpo}] Fase 1 - Status: ${errorTelefone.response?.status}`);
      console.log(`⚠️ [TESTE] [${cpfLimpo}] Fase 1 - Erro: ${JSON.stringify(errorTelefone.response?.data || errorTelefone.message)}`);
      
      // Verificar se é erro de telefone já utilizado
      if (isErroTelefone(errorTelefone)) {
        console.log(`📱 [TESTE] [${cpfLimpo}] Fase 1 - Erro de telefone detectado! Tentando com telefone alternativo (11+cpf)...`);
        
        const telefoneAlternativo = `11${cpfLimpo}`;
        console.log(`📱 [TESTE] [${cpfLimpo}] Fase 1 - Telefone alternativo: ${telefoneAlternativo}`);
        
        try {
          // Tentar novamente com telefone alternativo
          termo = await gerarTermoINSS({
            cpf: cpfLimpo,
            nome: validacao.dados.nome,
            telefone: telefoneAlternativo,
            produtoId: 28
          });
          console.log(`✅ [TESTE] [${cpfLimpo}] Fase 1 - Termo gerado com sucesso usando telefone alternativo: ${telefoneAlternativo}`);
        } catch (errorAlternativo) {
          console.error(`❌ [TESTE] [${cpfLimpo}] Fase 1 - Erro também com telefone alternativo`);
          throw errorAlternativo;
        }
      } else {
        // Se não for erro de telefone, relançar o erro original
        console.log(`❌ [TESTE] [${cpfLimpo}] Fase 1 - Erro não é de telefone. Relançando erro original.`);
        throw errorTelefone;
      }
    }
    
    const termoId = termo.id || termo.autorizacaoId;
    
    // Salvar no cache do servidor
    const { iniciarProcessamento, atualizarStatus } = require('../utils/cache-precencabank');
    iniciarProcessamento(cpfLimpo, {});
    atualizarStatus(cpfLimpo, 'PROCESSANDO', 'termo_gerado', {
      termoId: termoId,
      shortUrl: termo.shortUrl,
      url: termo.url,
      termo: termo
    });
    
    console.log(`✅ [TESTE] Fase 1 - Termo salvo no cache do servidor: ${termoId}`);
    
    res.json({
      success: true,
      resultado: {
        termoId: termoId,
        shortUrl: termo.shortUrl,
        url: termo.url,
        termo: termo
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na Fase 1 (Termo):', error);
    
    // Extrair mensagem de erro mais específica da API
    let mensagemErro = error.message || 'Erro ao gerar termo';
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status || 500;
      const errorData = error.response.data;
      
      if (errorData) {
        // Tentar extrair mensagem de erro de diferentes formatos
        if (errorData.errors && Array.isArray(errorData.errors)) {
          mensagemErro = errorData.errors.join('; ');
        } else if (errorData.messages && Array.isArray(errorData.messages)) {
          mensagemErro = errorData.messages.join('; ');
        } else if (errorData.message) {
          mensagemErro = errorData.message;
        } else if (typeof errorData === 'string') {
          mensagemErro = errorData;
        } else if (errorData.title) {
          mensagemErro = errorData.title;
          if (errorData.detail) {
            mensagemErro += `: ${errorData.detail}`;
          }
        } else if (errorData.detail) {
          mensagemErro = errorData.detail;
        } else if (errorData.developerMessage) {
          mensagemErro = errorData.developerMessage;
        } else {
          // Se não conseguir extrair, mostrar JSON completo
          const errorStr = JSON.stringify(errorData);
          mensagemErro = errorStr.length > 200 ? errorStr.substring(0, 200) + '...' : errorStr;
        }
      }
      
      console.error(`📄 [TESTE] Fase 1 - Resposta da API (status ${statusCode}):`, JSON.stringify(errorData, null, 2));
    }
    
    res.status(statusCode).json({
      success: false,
      error: mensagemErro,
      statusCode: statusCode,
      details: error.response?.data || null
    });
  }
});
