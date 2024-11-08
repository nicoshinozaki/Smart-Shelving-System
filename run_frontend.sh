#!/bin/bash

cd frontend
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate

if [ ! -f requirements.txt ]; then
    echo "Error: requirements.txt not found!"
    exit 1
fi

pip install -r requirements.txt
python frontend_main.py

# Deactivate the virtual environment
deactivate