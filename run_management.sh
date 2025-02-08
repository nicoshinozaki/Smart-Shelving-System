#!/bin/bash

cd management
python3 -m venv .venv

# Activate virtual environment
if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
    source .venv/bin/activate  # macOS/Linux
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate  # Windows
else
    echo "Unsupported OS type: $OSTYPE"
    exit 1
fi

if [ ! -f requirements.txt ]; then
    echo "Error: requirements.txt not found!"
    exit 1
fi

echo "Installing required packages..."
pip install -r requirements.txt > /dev/null


# Setting environmental variable for API credential file
export CREDENTIALS_PATH=../secret/smart-shelving-27ec95c7dcb2.json
echo "Starting management_main.py..."
python management_main.py &

# Deactivate the virtual environment
deactivate