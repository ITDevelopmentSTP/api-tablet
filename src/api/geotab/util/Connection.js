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
  DB_PORT
} = process.env

class Connection {
  constructor (options = {}) {
    this.config = {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }
    this.pool = null
  }

  // Crea el pool si no existe
  async _ensurePool () {
    if (!this.pool) {
      this.pool = mysql.createPool(this.config)
    }
    return this.pool
  }

  // Ejecuta una consulta SQL (SELECT/INSERT/UPDATE/DELETE) y devuelve los resultados.
  async query (sql, params = []) {
    const pool = await this._ensurePool()
    const connection = await pool.getConnection()
    try {
      const [rows] = await connection.query(sql, params)
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
      const [rows] = await connection.query(sql, params)
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
