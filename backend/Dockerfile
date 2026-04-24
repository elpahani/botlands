FROM node:20-slim

# Install python3 (for scripts only)
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npx tsc

CMD ["node", "dist/server.js"]
EXPOSE 3001
