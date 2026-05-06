import mysql from 'mysql2/promise'

// Configuração do pool de conexões MySQL
// Este arquivo prepara a conexão com o banco de dados para uso futuro
// Configure as variáveis de ambiente no arquivo .env

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fmp_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
})

// Função para executar queries
export async function query<T = unknown>(sql: string, values?: unknown[]): Promise<T> {
  try {
    const connection = await pool.getConnection()
    try {
      const [results] = await connection.execute(sql, values || [])
      return results as T
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Função para obter uma conexão (para transações)
export async function getConnection() {
  return pool.getConnection()
}

// Função para testar conexão com o banco
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('[MySQL] Connection test successful')
    return true
  } catch (error) {
    console.error('[MySQL] Connection test failed:', error)
    return false
  }
}

// Função para fechar o pool
export async function closePool() {
  return pool.end()
}

// Exportar o pool
export { pool }
