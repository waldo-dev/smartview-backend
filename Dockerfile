# Usar imagen oficial de Node.js con Alpine
FROM node:18-alpine

# Instalar herramientas necesarias para compilar dependencias nativas (como bcrypt)
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para mejor caching de capas Docker)
COPY package.json package-lock.json* ./

# Instalar dependencias de producción
RUN npm ci --only=production || npm install --only=production

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto de la aplicación
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["npm", "start"]

