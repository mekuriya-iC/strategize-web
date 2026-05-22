# Use the official Node.js 14 image based on Alpine Linux as the base image
FROM node:24

RUN corepack enable pnpm

ENV NEXT_PUBLIC_DOMAIN=strategize.com
ENV NEXT_PUBLIC_GRAPHQL_URL=https://strategize-api.frontiertech.org/graphql
ENV NEXT_PUBLIC_API=https://strategize-api.frontiertech.org/graphql
ENV NEXT_PUBLIC_DATA=https://strategize-api.frontiertech.org
ENV NEXT_PUBLIC_SOCKET=wss://strategize-api.frontiertech.org/graphql

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json pnpm-lock.yaml ./

# Install the app dependencies
RUN pnpm install

# Copy the rest of the app source code to the working directory
COPY . .

RUN pnpm run build

# Expose the port that the app will listen on
EXPOSE 4410

# Start the app
CMD [ "pnpm", "run", "start" ]
