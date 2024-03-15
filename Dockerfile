# Use an official Python runtime as a parent image
FROM python:3.9-slim



# Install project dependencies from requirements.txt
RUN pip install ollama



# Expose the port on which your service runs
EXPOSE 11434

# Run the label-studio command as the container's entry point
CMD ["ollama pull llama2"]
