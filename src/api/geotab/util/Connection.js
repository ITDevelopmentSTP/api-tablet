// Clase para manejar la conexión a la base de datos Geotab
// Usa mysql2/promise y un pool de conexiones. Cada operación obtiene
// una conexión del pool, la utiliza y la libera. También permite
// ejecutar procedimientos almacenados y transacciones.

import mysql from 'mysql2/promise'

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
  DB_CONNECT_TIMEOUT_MS,
  DB_QUERY_TIMEOUT_MS
} = process.env

// Timeouts con valores por defecto razonables para evitar cuelgues largos
const CONNECT_TIMEOUT = Number.parseInt(DB_CONNECT_TIMEOUT_MS ?? '5000', 10)
const QUERY_TIMEOUT = Number.parseInt(DB_QUERY_TIMEOUT_MS ?? '8000', 10)

class Connection {
  constructor (options = {}) {
    this.config = {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      port: DB_PORT,
      connectTimeout: CONNECT_TIMEOUT,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }
    this.pool = null
  }

  // Crea el pool si no existe
  async _ensurePool () {
    if (!this.pool) {
      // Validar configuración básica para fallar rápido y con mensaje claro
      const missing = []
      if (!this.config.host) missing.push('DB_HOST')
      if (!this.config.user) missing.push('DB_USER')
      if (!this.config.database) missing.push('DB_DATABASE')
      if (missing.length) {
        const err = new Error(`Variables de entorno faltantes: ${missing.join(', ')}`)
        err.code = 'CONFIG_ERROR'
        throw err
      }
      this.pool = mysql.createPool(this.config)
    }
    return this.pool
  }

  // Ejecuta una consulta SQL (SELECT/INSERT/UPDATE/DELETE) y devuelve los resultados.
  async query (sql, params = []) {
    const pool = await this._ensurePool()
    const connection = await pool.getConnection()
    try {
      // Aplicar timeout por consulta para evitar que se quede colgado indefinidamente
      const [rows] = await connection.query({ sql, values: params, timeout: QUERY_TIMEOUT })
      return rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    } finally {
      connection.release()
    }
  }

  // Ejecuta un procedimiento almacenado. Devuelve el resultado tal cual lo retorna mysql2.
  async callProcedure (procName, params = []) {
    const pool = await this._ensurePool()
    const connection = await pool.getConnection()
    try {
      const placeholders = params.map(() => '?').join(',')
      const sql = `CALL ${procName}(${placeholders})`
      const [rows] = await connection.query({ sql, values: params, timeout: QUERY_TIMEOUT })
      return rows
    } catch (error) {
      console.error('Database procedure call error:', error)
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * Ejecuta una transacción. La función callback recibe la conexión a usar
   * y debe devolver el resultado. Se hace commit si todo ok o rollback ante error.
   * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<*>} callback
   */
  async transaction (callback) {
    const pool = await this._ensurePool()
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (err) {
      try {
        await connection.rollback()
      } catch (e) {
        // swallow rollback errors but log if needed
        console.error('Rollback error', e)
      }
      throw err
    } finally {
      connection.release()
    }
  }

  // Cierra el pool de conexiones (usar al terminar la aplicación)
  async close () {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }
}

export default Connection
