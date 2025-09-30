# API Tablet

Este proyecto es una API desarrollada con [Express](https://expressjs.com/) que funciona como puente entre el frontend y la base de datos 4D.

## Características principales ⚡

- **Funciona como Bridge:** La API, en su mayoría, no modifica los datos; simplemente los envía tal cuál como vienen desde el frontend.
- **Nombres de Endpoints:** Todos los endpoints tiene el mismo nombre que los métodos en 4D.
- **Enturador en 4D:** El enrutador en 4D es `apiPatio`, agrupa los métodos que se usan en la api.

## Configuración de entorno ⚙️

- **Producción:** Los parámetros de **producción** deben estar en un archivo `.env`.
- **Desarrollo:** Los parámetros de **desarrollo** deben estar en un archivo `.env.dev`.

## Requerimientos 📃

- **Node 22.18.1 o superiores**

## Importante ❗

- Antes de levantar el proyecto debes configurar los archivos `.env` y `.env.dev`. Mira los ejemplos en `env.example` y `.env.dev.example`.

## Formas para para levantar la API 🚀

Instalar las dependencias

```sh
npm install
```

Levantar la API conectándose al 4D de desarrollo

```sh
npm run dev
```

Levantar la API conectándose al 4D de producción

```sh
npm run prod
```

Levantar la API conectándose al 4D de producción desde linux

```sh
npm run linux:prod
```

## Manejador de Errores 🏃‍♂️

Todos los errores de la API llegan al archivo `error-handler.js`. Los errores más comunes ya están controlados, por lo que ahí podrás ver exáctamente qué falló.
