#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait a bit for the server to start (adjust the sleep time as needed)
sleep 10

# Pull the desired model. Replace 'llama2' with your model of choice
ollama pull llama2 &

sleep 10

ollama run llama2 



# Keep the script running to keep the container alive.
# This script assumes external interaction with the Ollama server,
# such as through its REST API, to actually use the pulled model.
wait

