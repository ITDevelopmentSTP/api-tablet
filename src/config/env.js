const ENV_FILE = process.env.NODE_ENV === 'development' ? '.env.dev' : '.env'

/**
 * loadEnvFile carga las variables de entorno desde un archivo .env
 * funciona con node 22+
*/
process.loadEnvFile(ENV_FILE)
