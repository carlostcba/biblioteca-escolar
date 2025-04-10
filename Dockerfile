# Imagen base
FROM node:18

# Crear y usar el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto (ajustalo si tu app usa otro)
EXPOSE 3000

# Comando para correr la app
CMD ["npm", "start"]
