# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install curl and other dependencies you might need
# RUN apt-get update && apt-get install -y curl

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Copy a custom script that starts Ollama and selects the model
COPY start-ollama.sh /start-ollama.sh
RUN chmod +x /start-ollama.sh

# Expose the port on which Ollama's service runs
EXPOSE 11434

# Start the script to run Ollama and select the model
CMD ["/start-ollama.sh"]
