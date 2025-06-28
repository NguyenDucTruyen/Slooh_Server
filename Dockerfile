FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/node-app

# Copy package files
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application (this will compile TypeScript)
RUN yarn build

# Remove test files from build to avoid errors
RUN rm -rf build/tests

EXPOSE 3000

# Start command will be overridden by docker-compose
CMD ["yarn", "start"]