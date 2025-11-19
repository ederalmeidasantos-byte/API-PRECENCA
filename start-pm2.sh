#!/bin/bash

# Script para iniciar o servidor Presença Bank com PM2

cd "$(dirname "$0")"

echo "🚀 Iniciando servidor Presença Bank com PM2 - Rota 4000..."
echo "📁 Diretório: $(pwd)"
echo ""

# Verificar se o config.env existe
if [ ! -f "config/config.env" ]; then
    echo "❌ Erro: Arquivo config/config.env não encontrado!"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --production
fi

# Parar instância anterior se existir
pm2 delete presencabank-api-4000 2>/dev/null

# Iniciar com PM2
echo "✅ Iniciando servidor com PM2 na porta 4000..."
pm2 start ecosystem.config.js

# Mostrar status
pm2 status

echo ""
echo "📊 Para ver logs: pm2 logs presencabank-api-4000"
echo "🛑 Para parar: pm2 stop presencabank-api-4000"
echo "🔄 Para reiniciar: pm2 restart presencabank-api-4000"

