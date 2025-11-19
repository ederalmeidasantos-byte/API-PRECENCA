#!/bin/bash

# Script para iniciar o servidor Presença Bank

cd "$(dirname "$0")"

echo "🚀 Iniciando servidor Presença Bank - Rota 4000..."
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

# Iniciar servidor
echo "✅ Iniciando servidor na porta 4000..."
node server.js

