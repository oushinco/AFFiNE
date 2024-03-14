# Use an official Python runtime as a parent image
# FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code into the container
COPY . .

# Adjust permissions to ensure the directory is writable by arbitrary users
RUN chmod -R 777 /app && \
    mkdir /tmp/cache && chmod -R 777 /tmp/cache && \
    mkdir -p /.local && chmod -R 777 /.local


# Set any required environment variables
ENV AFFINE_ADMIN_EMAIL=datascience@police.nsw.gov.au
ENV AFFINE_ADMIN_PASSWORD=affine

# Expose the port on which your service runs
EXPOSE 3010

# Run the label-studio command as the container's entry point
CMD [docker compose -f ./.github/deployment/self-host/compose.yaml up"]
