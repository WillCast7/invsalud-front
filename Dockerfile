FROM node:22-alpine

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalación necesaria con el flag para evitar errores de librerías viejas
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de ng serve
EXPOSE 4200

# Arrancamos con host 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]