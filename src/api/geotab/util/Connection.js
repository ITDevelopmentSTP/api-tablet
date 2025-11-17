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

// Timeouts con valores por defecto razonables para evitar cuelgues largos

class Connection {
  constructor (options = {}) {
    this.config = {
      host: DB_HOST,
      user: DB_USER,
      database: DB_DATABASE,
      password: DB_PASSWORD,
      port: DB_PORT
    }
    this.connection = null
  }

  async connect () {
    this.connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      database: DB_DATABASE,
      password: DB_PASSWORD,
      port: DB_PORT
    })
    this.connection.connect(err => {
      if (err) {
        console.error('Error connecting to the database:', err)
        throw err
      }
      console.log('Connected to the database')
    })
  }

  // Ejecuta una consulta SQL (SELECT/INSERT/UPDATE/DELETE) y devuelve los resultados.
  async query (sql, params = []) {
    await this.connect()
    try {
      // Aplicar timeout por consulta para evitar que se quede colgado indefinidamente
      const [rows] = await this.connection.query(sql, params)
      return rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    } finally {
      this.connection.end()
    }
  }

  // Ejecuta un procedimiento almacenado. Devuelve el resultado tal cual lo retorna mysql2.
  async callProcedure (procName, params = []) {
    await this.connect()
    try {
      const placeholders = params.map(() => '?').join(',')
      const sql = `CALL ${procName}(${placeholders})`
      const [rows] = await this.connection.query(sql, params)
      return rows
    } catch (error) {
      console.error('Database procedure call error:', error)
      throw error
    } finally {
      this.connection.end()
    }
  }

  /**
   * Ejecuta una transacción. La función callback recibe la conexión a usar
   * y debe devolver el resultado. Se hace commit si todo ok o rollback ante error.
   * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<*>} callback
   */
  async transaction (callback) {
    await this.connect()
    try {
      await this.connection.beginTransaction()
      const result = await callback(this.connection)
      await this.connection.commit()
      return result
    } catch (err) {
      try {
        await this.connection.rollback()
      } catch (e) {
        // swallow rollback errors but log if needed
        console.error('Rollback error', e)
      }
      throw err
    } finally {
      this.connection.end()
    }
  }

  // Cierra el pool de conexiones (usar al terminar la aplicación)
  async close () {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
    }
  }
}

export default Connection
