// Sistema de cache usando localStorage
const CACHE_PREFIX = 'precencabank_teste_';

// Funções de cache
function salvarCache(fase, cpf, dados) {
    const key = `${CACHE_PREFIX}${fase}_${cpf}`;
    localStorage.setItem(key, JSON.stringify({
        cpf,
        dados,
        timestamp: new Date().toISOString()
    }));
    atualizarCacheInfo(fase, cpf);
}

function obterCache(fase, cpf) {
    const key = `${CACHE_PREFIX}${fase}_${cpf}`;
    const cached = localStorage.getItem(key);
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}

function limparCache(fase = null, cpf = null) {
    if (fase && cpf) {
        const key = `${CACHE_PREFIX}${fase}_${cpf}`;
        localStorage.removeItem(key);
        atualizarCacheInfo(fase, cpf);
    } else {
        // Limpar todo o cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        // Atualizar todas as fases
        for (let i = 1; i <= 5; i++) {
            const cpfInput = document.getElementById(`cpf-fase${i}`);
            if (cpfInput && cpfInput.value) {
                atualizarCacheInfo(i, cpfInput.value);
            } else {
                document.getElementById(`cache-fase${i}`).style.display = 'none';
            }
        }
        mostrarAlerta('success', 'Cache limpo com sucesso!');
    }
}

async function atualizarCacheInfo(fase, cpf) {
    const cacheInfo = document.getElementById(`cache-fase${fase}`);
    const cacheContent = document.getElementById(`cache-fase${fase}-content`);
    
    // Verificar se os elementos existem
    if (!cacheInfo || !cacheContent) {
        console.warn(`Elementos de cache não encontrados para fase ${fase}`);
        return;
    }
    
    // Buscar cache do servidor
    try {
        const response = await fetch(`/clt/precencabank/teste/cache/${cpf}`);
        const data = await response.json();
        
        if (data.success && data.cache) {
            let info = `CPF: ${cpf} | Cache do servidor`;
            let temCache = false;
            
            // Verificar cache específico da fase
            if (fase === 1 && data.cache.fase1 && data.cache.fase1.termoId) {
                info += ` | Termo ID: ${data.cache.fase1.termoId}`;
                temCache = true;
            } else if (fase === 2 && data.cache.fase2 && data.cache.fase2.assinado) {
                info += ` | Assinado: Sim`;
                temCache = true;
            } else if (fase === 3 && data.cache.fase3 && data.cache.fase3.margem) {
                info += ` | Margem consultada`;
                temCache = true;
            } else if (fase === 4 && data.dados && data.dados.resultado) {
                info += ` | Simulação realizada`;
                temCache = true;
            } else if (fase === 5 && data.cache && data.cache.fase5 && data.cache.fase5.oportunidadeId) {
                info += ` | Oportunidade ID: ${data.cache.fase5.oportunidadeId}`;
                if (data.cache.fase5.dadosCliente && data.cache.fase5.dadosCliente.nome) {
                    info += ` | Nome: ${data.cache.fase5.dadosCliente.nome}`;
                }
                temCache = true;
            }
            
            if (temCache) {
                cacheContent.textContent = info;
                cacheInfo.style.display = 'block';
            } else {
                cacheInfo.style.display = 'none';
            }
        } else {
            cacheInfo.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao buscar cache do servidor:', error);
        if (cacheInfo) {
            cacheInfo.style.display = 'none';
        }
    }
}

// Função para mostrar alertas
function mostrarAlerta(tipo, mensagem) {
    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 500px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        word-wrap: break-word;
        white-space: pre-wrap;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    if (tipo === 'success') {
        alerta.style.background = '#4caf50';
    } else if (tipo === 'error') {
        alerta.style.background = '#f44336';
    } else {
        alerta.style.background = '#ff9800';
    }
    
    // Se a mensagem for muito longa, criar um botão para expandir
    if (mensagem.length > 200) {
        const mensagemCurta = mensagem.substring(0, 200) + '...';
        const mensagemCompleta = mensagem;
        let expandido = false;
        
        const texto = document.createElement('div');
        texto.textContent = mensagemCurta;
        texto.style.marginBottom = '10px';
        
        const btnExpandir = document.createElement('button');
        btnExpandir.textContent = 'Ver detalhes completos';
        btnExpandir.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        btnExpandir.onclick = () => {
            if (expandido) {
                texto.textContent = mensagemCurta;
                btnExpandir.textContent = 'Ver detalhes completos';
                expandido = false;
            } else {
                texto.textContent = mensagemCompleta;
                btnExpandir.textContent = 'Ocultar detalhes';
                expandido = true;
            }
        };
        
        alerta.appendChild(texto);
        alerta.appendChild(btnExpandir);
    } else {
        alerta.textContent = mensagem;
    }
    
    document.body.appendChild(alerta);
    
    // Para erros, manter por mais tempo e adicionar botão de fechar
    const tempoExibicao = tipo === 'error' ? 10000 : 3000;
    
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '✕';
    btnFechar.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        line-height: 20px;
    `;
    btnFechar.onclick = () => {
        alerta.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alerta.remove(), 300);
    };
    alerta.appendChild(btnFechar);
    
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alerta.parentNode) {
                    alerta.remove();
                }
            }, 300);
        }
    }, tempoExibicao);
}

// Função para mostrar resultado
function mostrarResultado(fase, sucesso, dados, erro = null) {
    const resultado = document.getElementById(`resultado-fase${fase}`);
    const resultadoContent = document.getElementById(`resultado-fase${fase}-content`);
    
    // Verificar se os elementos existem
    if (!resultado || !resultadoContent) {
        console.warn(`Elementos de resultado não encontrados para fase ${fase}`);
        return;
    }
    
    resultado.classList.remove('success', 'error', 'loading');
    
    if (sucesso) {
        resultado.classList.add('success', 'show');
        resultadoContent.textContent = JSON.stringify(dados, null, 2);
        
        // Salvar no cache
        const cpfInput = document.getElementById(`cpf-fase${fase}`);
        if (cpfInput && cpfInput.value) {
            salvarCache(fase, cpfInput.value, dados);
        }
    } else {
        resultado.classList.add('error', 'show');
        resultadoContent.textContent = erro || 'Erro desconhecido';
    }
}

// Função para mostrar loading
function mostrarLoading(fase) {
    const resultado = document.getElementById(`resultado-fase${fase}`);
    const resultadoContent = document.getElementById(`resultado-fase${fase}-content`);
    
    // Verificar se os elementos existem
    if (!resultado || !resultadoContent) {
        console.warn(`Elementos de resultado não encontrados para fase ${fase}`);
        return;
    }
    
    resultado.classList.remove('success', 'error');
    resultado.classList.add('loading', 'show');
    resultadoContent.textContent = '⏳ Processando...';
}

// FASE 1: Solicitar Termo
async function executarFase1() {
    const cpfInput = document.getElementById('cpf-fase1');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!cpf || cpf.length !== 11) {
        mostrarAlerta('error', 'CPF inválido! Digite 11 dígitos.');
        return;
    }
    
    console.log(`🧪 [FRONTEND] Fase 1 - Iniciando execução para CPF: ${cpf}`);
    
    // Verificar cache do servidor
    try {
        const cacheResponse = await fetch(`/clt/precencabank/teste/cache/${cpf}`);
        const cacheData = await cacheResponse.json();
        
        if (cacheData.success && cacheData.cache && cacheData.cache.fase1 && cacheData.cache.fase1.termoId) {
            if (confirm('Termo já existe no cache do servidor. Deseja usar o cache ou gerar um novo?')) {
                mostrarResultado(1, true, cacheData.cache.fase1);
                mostrarAlerta('success', 'Usando cache do servidor!');
                return;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar cache:', error);
    }
    
    mostrarLoading(1);
    console.log(`🔄 [FRONTEND] Fase 1 - Enviando requisição para /clt/precencabank/teste/fase1-termo`);
    
    try {
        const response = await fetch('/clt/precencabank/teste/fase1-termo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf })
        });
        
        console.log(`📡 [FRONTEND] Fase 1 - Resposta recebida. Status: ${response.status}`);
        
        // Verificar se a resposta é OK antes de fazer parse
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` };
            }
            
            console.error(`❌ [FRONTEND] Fase 1 - Erro na resposta:`, errorData);
            
            let mensagemErro = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
            
            // Verificar se o erro é de telefone já utilizado
            // NOTA: O servidor já tenta automaticamente com telefone alternativo (11+cpf)
            // Se chegou aqui, significa que ambas as tentativas falharam
            const erroTelefone = mensagemErro.includes('Telefone já utilizado') || 
                                mensagemErro.includes('telefone já utilizado') ||
                                (errorData.details && JSON.stringify(errorData.details).includes('Telefone já utilizado'));
            
            if (erroTelefone) {
                console.log(`📱 [FRONTEND] Fase 1 - Erro de telefone detectado após tentativa automática com telefone alternativo.`);
                mensagemErro = `[Status ${errorData.statusCode || response.status}] ${mensagemErro}\n\n⚠️ O sistema tentou automaticamente com telefone alternativo (11+cpf), mas ainda assim ocorreu erro.\nVerifique os logs do servidor para mais detalhes.`;
            }
            
            if (errorData.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(errorData.details, null, 2)}`;
            }
            if (errorData.statusCode || response.status) {
                mensagemErro = `[Status ${errorData.statusCode || response.status}] ${mensagemErro}`;
            }
            
            mostrarResultado(1, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
            return;
        }
        
        const data = await response.json();
        console.log(`✅ [FRONTEND] Fase 1 - Dados recebidos:`, data);
        
        if (data.success) {
            // Verificar se foi usado telefone alternativo (verificar nos logs do servidor)
            let mensagemSucesso = 'Termo gerado com sucesso e salvo no servidor!';
            
            // Atualizar cache info do servidor
            await atualizarCacheInfo(1, cpf);
            
            // Formatar resultado para exibição
            const resultadoFormatado = {
                ...data.resultado,
                observacao: 'Verifique os logs do servidor para ver se foi usado telefone alternativo (11+cpf)'
            };
            
            mostrarResultado(1, true, resultadoFormatado);
            mostrarAlerta('success', mensagemSucesso);
            console.log(`✅ [FRONTEND] Fase 1 - Termo gerado com sucesso! Termo ID: ${data.resultado?.termoId || 'N/A'}`);
        } else {
            // Mostrar mensagem de erro detalhada
            let mensagemErro = data.error || data.message || 'Erro desconhecido';
            if (data.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`;
            }
            if (data.statusCode) {
                mensagemErro = `[Status ${data.statusCode}] ${mensagemErro}`;
            }
            mostrarResultado(1, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
        }
    } catch (error) {
        console.error(`❌ [FRONTEND] Fase 1 - Erro na requisição:`, error);
        let mensagemErro = error.message || 'Erro desconhecido';
        
        if (error.message === 'Failed to fetch') {
            mensagemErro = 'Erro de conexão com o servidor. Verifique se o servidor está rodando e tente novamente.';
        }
        
        mostrarResultado(1, false, null, mensagemErro);
        mostrarAlerta('error', mensagemErro);
    }
}

// FASE 2: Assinar Termo
async function executarFase2() {
    const cpfInput = document.getElementById('cpf-fase2');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!cpf || cpf.length !== 11) {
        mostrarAlerta('error', 'CPF inválido! Digite 11 dígitos.');
        return;
    }
    
    // Verificar cache do servidor
    let cacheData;
    let termoUrl;
    try {
        const cacheResponse = await fetch(`/clt/precencabank/teste/cache/${cpf}`);
        cacheData = await cacheResponse.json();
        
        // Logs de debug
        console.log('🔍 [DEBUG] Fase 2 - Cache do servidor:', JSON.stringify(cacheData, null, 2));
        
        if (cacheData.success && cacheData.cache && cacheData.cache.fase2 && cacheData.cache.fase2.assinado) {
            if (confirm('Termo já está assinado no cache do servidor. Deseja usar o cache ou assinar novamente?')) {
                mostrarResultado(2, true, cacheData.cache.fase2);
                mostrarAlerta('success', 'Usando cache do servidor!');
                return;
            }
        }
        
        // Verificar se tem termo (fase 1) no cache do servidor
        console.log('🔍 [DEBUG] Fase 2 - Verificando cache fase1:');
        console.log('  cacheData.success:', cacheData.success);
        console.log('  cacheData.cache:', cacheData.cache);
        console.log('  cacheData.cache?.fase1:', cacheData.cache?.fase1);
        console.log('  cacheData.dados:', cacheData.dados);
        
        // Verificar se tem dados da fase 1 no cache formatado
        if (!cacheData.success) {
            console.error('❌ [DEBUG] Fase 2 - Cache não encontrado no servidor');
            mostrarAlerta('error', 'Cache não encontrado no servidor. Execute a Fase 1 primeiro para gerar o termo!');
            return;
        }
        
        // Verificar se tem fase1 no cache formatado
        if (!cacheData.cache || !cacheData.cache.fase1) {
            console.error('❌ [DEBUG] Fase 2 - Fase 1 não encontrada no cache formatado');
            // Tentar usar dados diretos
            if (cacheData.dados && (cacheData.dados.shortUrl || cacheData.dados.url)) {
                console.log('✅ [DEBUG] Fase 2 - Usando dados diretos do cache');
                termoUrl = cacheData.dados.shortUrl || cacheData.dados.url;
            } else {
                mostrarAlerta('error', 'Termo não encontrado no cache do servidor. Execute a Fase 1 primeiro para gerar o termo!');
                return;
            }
        } else {
            // Usar dados do cache formatado
            termoUrl = cacheData.cache.fase1.shortUrl || cacheData.cache.fase1.url;
        }
        
        if (!termoUrl) {
            console.error('❌ [DEBUG] Fase 2 - URL do termo não encontrada');
            mostrarAlerta('error', 'URL do termo não encontrada no cache do servidor! Execute a Fase 1 primeiro.');
            return;
        }
        
        console.log('✅ [DEBUG] Fase 2 - Termo URL encontrada:', termoUrl);
    } catch (error) {
        console.error('❌ [DEBUG] Fase 2 - Erro ao verificar cache:', error);
        mostrarAlerta('error', 'Erro ao verificar cache do servidor! ' + error.message);
        return;
    }
    
    mostrarLoading(2);
    
    try {
        const response = await fetch('/clt/precencabank/teste/fase2-assinatura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf,
                termoUrl: termoUrl
            })
        });
        
        // Verificar se a resposta é OK antes de fazer parse
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` };
            }
            
            let mensagemErro = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
            if (errorData.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(errorData.details, null, 2)}`;
            }
            if (errorData.statusCode || response.status) {
                mensagemErro = `[Status ${errorData.statusCode || response.status}] ${mensagemErro}`;
            }
            
            mostrarResultado(2, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Atualizar cache info do servidor
            await atualizarCacheInfo(2, cpf);
            mostrarResultado(2, true, data.resultado);
            mostrarAlerta('success', 'Termo assinado com sucesso e salvo no servidor!');
        } else {
            // Mostrar mensagem de erro detalhada
            let mensagemErro = data.error || data.message || 'Erro desconhecido';
            if (data.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`;
            }
            if (data.statusCode) {
                mensagemErro = `[Status ${data.statusCode}] ${mensagemErro}`;
            }
            mostrarResultado(2, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
        }
    } catch (error) {
        let mensagemErro = error.message || 'Erro desconhecido';
        mostrarResultado(2, false, null, mensagemErro);
        mostrarAlerta('error', mensagemErro);
    }
}

// FASE 3: Consultar Margem
async function executarFase3() {
    const cpfInput = document.getElementById('cpf-fase3');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!cpf || cpf.length !== 11) {
        mostrarAlerta('error', 'CPF inválido! Digite 11 dígitos.');
        return;
    }
    
    // Verificar cache do servidor
    let cacheFase1, cacheFase2, termoId;
    try {
        const cacheResponse = await fetch(`/clt/precencabank/teste/cache/${cpf}`);
        const cacheData = await cacheResponse.json();
        
        console.log('🔍 [DEBUG] Fase 3 - Verificando cache do servidor:');
        console.log('  Cache completo:', cacheData);
        
        if (cacheData.success && cacheData.cache) {
            cacheFase1 = cacheData.cache.fase1;
            cacheFase2 = cacheData.cache.fase2;
            
            console.log('  Cache Fase 1:', cacheFase1);
            console.log('  Cache Fase 2:', cacheFase2);
            console.log('  Cache Fase 1 tem termoId?', cacheFase1?.termoId ? 'SIM' : 'NÃO');
            console.log('  Cache Fase 2 tem assinado?', cacheFase2?.assinado ? 'SIM' : 'NÃO');
            
            if (!cacheFase1 || !cacheFase1.termoId) {
                console.error('❌ [DEBUG] Fase 3 - Cache Fase 1 não encontrado ou sem termoId');
                mostrarAlerta('error', 'Execute a Fase 1 primeiro para gerar o termo!');
                return;
            }
            
            if (!cacheFase2 || !cacheFase2.assinado) {
                console.error('❌ [DEBUG] Fase 3 - Cache Fase 2 não encontrado ou termo não assinado');
                mostrarAlerta('error', 'Execute a Fase 2 primeiro para assinar o termo!');
                return;
            }
            
            termoId = cacheFase1.termoId;
            console.log('✅ [DEBUG] Fase 3 - Cache validado, termoId:', termoId);
        } else {
            console.error('❌ [DEBUG] Fase 3 - Cache não encontrado no servidor');
            mostrarAlerta('error', 'Cache não encontrado no servidor. Execute a Fase 1 e Fase 2 primeiro!');
            return;
        }
    } catch (error) {
        console.error('❌ [DEBUG] Fase 3 - Erro ao buscar cache:', error);
        mostrarAlerta('error', 'Erro ao verificar cache do servidor!');
        return;
    }
    
    mostrarLoading(3);
    
    try {
        const response = await fetch('/clt/precencabank/teste/fase3-margem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf,
                termoId: termoId
            })
        });
        
        // Verificar se a resposta é OK antes de fazer parse
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` };
            }
            
            let mensagemErro = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
            if (errorData.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(errorData.details, null, 2)}`;
            }
            if (errorData.sugestao) {
                mensagemErro += `\n\n💡 Sugestão: ${errorData.sugestao}`;
            }
            if (errorData.statusCode || response.status) {
                mensagemErro = `[Status ${errorData.statusCode || response.status}] ${mensagemErro}`;
            }
            
            mostrarResultado(3, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            mostrarResultado(3, true, data.resultado);
            mostrarAlerta('success', 'Margem consultada com sucesso!');
        } else {
            // Mostrar mensagem de erro detalhada
            let mensagemErro = data.error || data.message || 'Erro desconhecido';
            if (data.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`;
            }
            if (data.sugestao) {
                mensagemErro += `\n\n💡 Sugestão: ${data.sugestao}`;
            }
            if (data.statusCode) {
                mensagemErro = `[Status ${data.statusCode}] ${mensagemErro}`;
            }
            mostrarResultado(3, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
        }
    } catch (error) {
        let mensagemErro = error.message || 'Erro desconhecido';
        mostrarResultado(3, false, null, mensagemErro);
        mostrarAlerta('error', mensagemErro);
    }
}

// FASE 4: Simulação
async function executarFase4() {
    const cpfInput = document.getElementById('cpf-fase4');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!cpf || cpf.length !== 11) {
        mostrarAlerta('error', 'CPF inválido! Digite 11 dígitos.');
        return;
    }
    
    // Verificar cache do servidor para Fase 3
    console.log('🔍 [DEBUG] Fase 4 - Verificando cache do servidor:');
    let cacheFase3 = null;
    let dadosMargem = null;
    
    try {
        const cacheResponse = await fetch(`/clt/precencabank/teste/cache/${cpf}`);
        const cacheData = await cacheResponse.json();
        
        console.log('  Cache completo:', cacheData);
        
        if (cacheData.success && cacheData.dados) {
            const dados = cacheData.dados;
            
            // Verificar se tem dados da Fase 3 no cache formatado
            if (cacheData.cache && cacheData.cache.fase3 && cacheData.cache.fase3.margem) {
                dadosMargem = cacheData.cache.fase3.margem;
                console.log('✅ [DEBUG] Fase 4 - Dados da margem encontrados no cache formatado');
            } 
            // Se não tiver no cache formatado, construir a partir dos dados completos
            else if (dados.dadosMargem && dados.margem) {
                // Combinar dadosMargem (termoId, matricula, cnpj) com margem (dados da margem)
                dadosMargem = {
                    ...dados.dadosMargem,
                    margem: dados.margem
                };
                console.log('✅ [DEBUG] Fase 4 - Dados da margem combinados (dadosMargem + margem)');
            }
            // Se tiver apenas dadosMargem, verificar se tem margem separadamente
            else if (dados.dadosMargem) {
                dadosMargem = {
                    ...dados.dadosMargem,
                    margem: dados.margem || null
                };
                console.log('✅ [DEBUG] Fase 4 - Dados da margem encontrados (dadosMargem)');
            }
            // Se tiver apenas margem, construir dadosMargem
            else if (dados.margem) {
                dadosMargem = {
                    termoId: dados.termoId,
                    matricula: dados.matricula,
                    cnpj: dados.cnpj,
                    termoAssinado: dados.termoAssinado || dados.assinado || true,
                    margem: dados.margem
                };
                console.log('✅ [DEBUG] Fase 4 - Dados da margem construídos a partir do cache');
            }
        }
        
        if (!dadosMargem) {
            console.log('❌ [DEBUG] Fase 4 - Dados da margem NÃO encontrados no cache do servidor');
            mostrarAlerta('error', 'Execute a Fase 3 primeiro para consultar a margem!');
            return;
        }
        
        console.log('✅ [DEBUG] Fase 4 - Dados da margem encontrados:', dadosMargem);
    } catch (error) {
        console.error('❌ [DEBUG] Fase 4 - Erro ao buscar cache do servidor:', error);
        mostrarAlerta('error', 'Erro ao verificar cache do servidor. Execute a Fase 3 primeiro!');
        return;
    }
    
    mostrarLoading(4);
    
    try {
        const response = await fetch('/clt/precencabank/teste/fase4-simulacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf,
                dadosMargem: dadosMargem
            })
        });
        
        // Verificar se a resposta é OK antes de fazer parse
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` };
            }
            
            let mensagemErro = errorData.error || errorData.message || `Erro HTTP ${response.status}`;
            if (errorData.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(errorData.details, null, 2)}`;
            }
            if (errorData.statusCode || response.status) {
                mensagemErro = `[Status ${errorData.statusCode || response.status}] ${mensagemErro}`;
            }
            
            mostrarResultado(4, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            mostrarResultado(4, true, data.resultado);
            mostrarAlerta('success', 'Simulação realizada com sucesso!');
        } else {
            // Mostrar mensagem de erro detalhada
            let mensagemErro = data.error || data.message || 'Erro desconhecido';
            if (data.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`;
            }
            if (data.statusCode) {
                mensagemErro = `[Status ${data.statusCode}] ${mensagemErro}`;
            }
            mostrarResultado(4, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
        }
    } catch (error) {
        let mensagemErro = error.message || 'Erro desconhecido';
        mostrarResultado(4, false, null, mensagemErro);
        mostrarAlerta('error', mensagemErro);
    }
}

// FASE 5: Buscar Dados na Kentro
async function executarFase5() {
    const cpfInput = document.getElementById('cpf-fase5');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!cpf || cpf.length !== 11) {
        mostrarAlerta('error', 'CPF inválido! Digite 11 dígitos.');
        return;
    }
    
    mostrarLoading(5);
    
    try {
        const response = await fetch('/clt/precencabank/teste/fase5-kentro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarResultado(5, true, data.resultado);
            mostrarAlerta('success', 'Dados da Kentro buscados com sucesso!');
            // Atualizar cache info após buscar
            atualizarCacheInfo(5, cpf);
        } else {
            // Mostrar mensagem de erro detalhada
            let mensagemErro = data.error || data.message || 'Erro desconhecido';
            if (data.details) {
                mensagemErro += `\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`;
            }
            if (data.statusCode) {
                mensagemErro = `[Status ${data.statusCode}] ${mensagemErro}`;
            }
            mostrarResultado(5, false, null, mensagemErro);
            mostrarAlerta('error', mensagemErro);
        }
    } catch (error) {
        let mensagemErro = error.message || 'Erro desconhecido';
        mostrarResultado(5, false, null, mensagemErro);
        mostrarAlerta('error', mensagemErro);
    }
}

// Atualizar cache info quando CPF é digitado
document.addEventListener('DOMContentLoaded', function() {
    for (let i = 1; i <= 5; i++) {
        const cpfInput = document.getElementById(`cpf-fase${i}`);
        if (cpfInput) {
            cpfInput.addEventListener('input', function() {
                const cpf = this.value.replace(/\D/g, '');
                if (cpf.length === 11) {
                    atualizarCacheInfo(i, cpf);
                } else {
                    document.getElementById(`cache-fase${i}`).style.display = 'none';
                }
            });
        }
    }
});

// Função de debug global para verificar cache (pode ser chamada no console)
window.debugCachePrecencabank = function(cpf) {
    if (!cpf) {
        console.error('❌ CPF não fornecido! Use: debugCachePrecencabank("16183805831")');
        return;
    }
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log('🔍 [DEBUG] Verificando cache para CPF:', cpfLimpo);
    console.log('==========================================');
    
    for (let fase = 1; fase <= 4; fase++) {
        const cache = obterCache(fase, cpfLimpo);
        console.log(`\n📦 Fase ${fase}:`);
        if (cache) {
            console.log('  ✅ Cache encontrado');
            console.log('  📅 Timestamp:', cache.timestamp);
            console.log('  📋 Dados:', JSON.stringify(cache.dados, null, 2));
            
            if (fase === 1) {
                console.log('  🆔 Termo ID:', cache.dados?.termoId || 'NÃO ENCONTRADO');
            }
            if (fase === 2) {
                console.log('  ✍️ Assinado:', cache.dados?.assinado ? 'SIM ✅' : 'NÃO ❌');
            }
        } else {
            console.log('  ❌ Cache não encontrado');
        }
    }
    
    console.log('\n==========================================');
    console.log('💡 Dica: Para limpar cache, use: limparCache()');
};

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
