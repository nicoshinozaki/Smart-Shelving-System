#!/bin/bash

set -x

# Unlock secret files with git-crypt
if [ -z "$1" ]; then
    echo "Error: No key file provided for git-crypt!"
    exit 1
fi

git-crypt unlock "$1"
if [ $? -ne 0 ]; then
    echo "Error: Failed to unlock secret files!"
    exit 1
fi

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

pip install -r requirements.txt

pyuic6 src/Smart_Shelving_System.ui -o ui_Smart_Shelving_System.py

# Setting environmental variable for API credential file
export CREDENTIALS_PATH=secret/smart-shelving-27ec95c7dcb2.json
nohup python management_main.py > management_main.log 2>&1 &

# Deactivate the virtual environment
deactivate