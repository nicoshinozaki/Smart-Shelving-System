from src.ui_Smart_Shelving_System import Ui_MainWindow
import sys
from PySide6.QtWidgets import QApplication, QMainWindow

app = QApplication(sys.argv)
MainWindow = QMainWindow()
ui = Ui_MainWindow()
ui.setupUi(MainWindow)
MainWindow.show()
sys.exit(app.exec_())