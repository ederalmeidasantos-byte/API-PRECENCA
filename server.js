const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'config.env') });

// Importar rotas
const precencabankRoutes = require('./routes/precencabank');

// Configurar Express
const app = express();

// Middleware de segurança (com CSP ajustado para permitir inline handlers)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Permite onclick e outros event handlers inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: null, // Desabilitar upgrade automático para HTTPS
    },
  },
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas HTML
app.get('/teste-fases-precencabank.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teste-fases-precencabank.html'));
});

app.get('/precencabank-lote.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'precencabank-lote.html'));
});

// Rotas da API (com prefixo /clt para compatibilidade com frontend)
app.use('/clt', precencabankRoutes);
app.use('/', precencabankRoutes); // Também disponível sem prefixo

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Presença Bank API',
    port: process.env.PORT || 4000
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    service: 'Presença Bank API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      testeFases: '/teste-fases-precencabank.html',
      lote: '/precencabank-lote.html',
      status: '/status-precencabank/:cpf',
      fluxoCompleto: '/fluxo-completo-precencabank',
      loteIniciar: '/precencabank/lote/iniciar',
      loteStatus: '/precencabank/lote/:loteId/status',
      loteListar: '/precencabank/lote/listar-ativos'
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🏦 ===== SISTEMA PRESENÇA BANK =====`);
  console.log(`🌐 Servidor rodando em: http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🧪 Teste de fases: http://${HOST}:${PORT}/teste-fases-precencabank.html`);
  console.log(`📦 Processamento em lote: http://${HOST}:${PORT}/precencabank-lote.html`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`=====================================\n`);
});

module.exports = app;
