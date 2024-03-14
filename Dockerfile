# Use the specified stable version of the AFFiNE GraphQL service
FROM ghcr.io/toeverything/affine-graphql:stable


# Assuming you have the necessary scripts in your local scripts directory
COPY ./scripts /usr/src/app/scripts


# Set the working directory in the container
WORKDIR /usr/src/app

# The command from the compose.yaml
CMD ["sh", "-c", "node ./scripts/self-host-predeploy && node ./dist/index.js"]



# Expose the ports used by the application
EXPOSE 3010 5555

# Environment variables setup
ENV NODE_OPTIONS="--import=./scripts/register.js" \
    AFFINE_CONFIG_PATH=/root/.affine/config \
    REDIS_SERVER_HOST=redis \
    DATABASE_URL=postgres://affine:affine@postgres:5432/affine \
    NODE_ENV=production \
    AFFINE_ADMIN_EMAIL=datascience@police.nsw.gov.au \
    AFFINE_ADMIN_PASSWORD=affine

# Volumes setup for persistent data
VOLUME ["/root/.affine/config", "/root/.affine/storage"]

