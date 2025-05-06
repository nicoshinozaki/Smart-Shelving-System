#!/bin/bash

cd management
~/.pyenv/versions/3.9.10/bin/python -m venv .venv_py_3.9.10
echo "running pyenv"

nmcli connection up zebra-eth

# Activate virtual environment
if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
    if [ "$SHELL" == "/usr/bin/fish" ]; then
        source .venv_py_3.9.10/bin/activate.fish  # macOS/Linux with fish shell
    else
        source .venv_py_3.9.10/bin/activate  # macOS/Linux with other shells
    fi
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    source .venv_py_3.9.10/Scripts/activate  # Windows
else
    echo "Unsupported OS type: $OSTYPE"
    exit 1
fi

if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "Error: Virtual environment not activated!"
    exit 1
fi

if [ ! -f requirements.txt ]; then
    echo "Error: requirements.txt not found!"
    exit 1
fi

echo "Installing required packages..."
# pip install --upgrade pip setuptools wheel
pip install -r requirements.txt > /dev/null

echo "Setting up ethernet port IP address..."
nmcli connection up zebra-eth

# Setting environmental variable for API credential file
export CREDENTIALS_PATH=../secret/smart-shelving-27ec95c7dcb2.json
echo "Starting management_main.py..."
python management_main.py

# Deactivate the virtual environment
deactivate