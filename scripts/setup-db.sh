#!/bin/bash

# Script para configurar o banco de dados
echo "🚀 Iniciando configuração do banco de dados..."

# Aguardar o PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL..."
while ! docker exec socio-desk-db pg_isready -U dev > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL pronto!"

# Aplicar schema
echo "📝 Aplicando schema..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Schema aplicado com sucesso!"
else
    echo "❌ Erro ao aplicar schema"
    exit 1
fi

# Rodar seed
echo "🌱 Inserindo dados iniciais..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Seed aplicado com sucesso!"
    echo "🎉 Banco de dados configurado!"
else
    echo "❌ Erro ao aplicar seed"
    exit 1
fi