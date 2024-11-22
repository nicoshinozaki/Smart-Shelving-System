#!/bin/bash
set -x

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
export CREDENTIALS_PATH=path-to-credentials.json # Update so it matches the path of the json file in your set up

python management_main.py

# Deactivate the virtual environment
deactivate