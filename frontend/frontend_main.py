import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QLabel, QVBoxLayout, QWidget

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Smart Shelving System")
        
        self.button = QPushButton("Some Button")
        self.button.clicked.connect(self.button_clicked)
        
        # Create a label
        self.label = QLabel("Hello, PyQt!")
        
        # Layout setup
        layout = QVBoxLayout()
        layout.addWidget(self.label)
        layout.addWidget(self.button)
        
        # Main widget
        main_widget = QWidget()
        main_widget.setLayout(layout)
        
        # Set the central widget of the window
        self.setCentralWidget(main_widget)

    def button_clicked(self):
        self.label.setText("Button was clicked!")

app = QApplication(sys.argv)
window = MainWindow()
window.show()
sys.exit(app.exec())