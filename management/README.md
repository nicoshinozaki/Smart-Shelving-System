# Front End Python Application

We are using PyQt6 GUI package so we can make a swift transformation to C++ later if we wanted to.
A great Qt design tool that is called Qt Widgets Designer can be used to facilitate the design process.

## Qt Designer

If you are on MacOS and you have homebrew, run `brew install qt6` to install the latest version. It should
also add Qt Designer to your system. Run `designer` to start the designer application. The Qt Designer
generates `.ui` files that can be converted to runnable python code with `pyuic6`, which also comes with Qt
if you installed Qt using homebrew.

Once running QtDesigner, to open the application window, select the Smart_Shelving_System.ui file from the src file to open in the prompt window. Any changes in QtDesigner will automatically be saved to the file itself.

## Display Functions
The behavior of the display window (API calls, other functions) can be edited in the management_main.py file.
