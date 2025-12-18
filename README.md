# smartview Backend

Backend del proyecto smartview desarrollado con Node.js y Express.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar el servidor:
```bash
# Modo desarrollo (con watch)
npm run dev

# Modo producción
npm start
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js          # Punto de entrada del servidor
│   ├── routes/            # Definición de rutas
│   ├── controllers/        # Lógica de controladores
│   ├── models/            # Modelos de datos
│   ├── middleware/        # Middlewares personalizados
│   └── utils/             # Utilidades
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Endpoints

- `GET /` - Información de la API
- `GET /health` - Health check del servidor

