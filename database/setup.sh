#!/bin/bash

# Script de Setup do Banco de Dados - FMP Dashboard
# Executa todas as migrações em ordem sequencial
# Intervalo de verificação: 60 segundos (1 minuto)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações (usar variáveis de ambiente ou valores padrão)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-fmp_dashboard}

echo -e "${BLUE}=== FMP Dashboard Database Setup ===${NC}"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo ""

# Verificar se MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL client not found. Please install MySQL.${NC}"
    exit 1
fi

# Criar banco de dados
echo -e "${YELLOW}1. Criando banco de dados...${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
echo -e "${GREEN}✓ Banco de dados criado${NC}"

# Executar migrações
echo ""
echo -e "${YELLOW}2. Executando migrações...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    echo -e "${YELLOW}Executando: $(basename $migration)${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" < "$migration"
    echo -e "${GREEN}✓ $(basename $migration) concluída${NC}"
  fi
done

echo ""
echo -e "${GREEN}=== Setup Concluído com Sucesso ===${NC}"
echo ""
echo -e "${BLUE}Configuração do Projeto:${NC}"
echo ""
echo "1. Configure as variáveis de ambiente no arquivo .env:"
echo ""
echo "   # Database"
echo "   DB_HOST=$DB_HOST"
echo "   DB_PORT=$DB_PORT"
echo "   DB_USER=$DB_USER"
echo "   DB_PASSWORD=your-password"
echo "   DB_NAME=$DB_NAME"
echo ""
echo "   # n8n Webhook"
echo "   N8N_API_KEY=your-n8n-api-key"
echo ""
echo "2. Inicie o servidor:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "3. Acesse o dashboard em http://localhost:3000"
echo ""
echo "4. Teste a API:"
echo "   GET  /api/services      - Lista todos os serviços"
echo "   GET  /api/status        - Status geral do sistema"
echo "   POST /api/services/check - Forçar verificação manual"
echo "   POST /api/webhook/n8n   - Webhook para n8n"
echo ""
echo -e "${BLUE}Intervalo de Verificação: 60 segundos (1 minuto)${NC}"
echo ""
