# Use an official Python runtime as a parent image
FROM python:3.9-slim


# Copy the install.sh script from your local repository to the Docker image
COPY install.sh /install.sh

# Ensure the script is executable
RUN chmod +x /install.sh

# Run the install.sh script to install Ollama
RUN ./install.sh

# Verify Ollama installation
RUN ollama --version

# Expose the API port used by Ollama (if applicable)
EXPOSE 11434

# Copy your start-up script into the container (if you have one)
COPY start-ollama.sh /start-ollama.sh
RUN chmod +x /start-ollama.sh

# Use the start-up script to run your application (adjust as necessary)
CMD ["/start-ollama.sh"]
