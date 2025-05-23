from PyQt6.QtWidgets import QApplication, QMainWindow, QLabel
from PyQt6.QtGui import QAction, QActionGroup

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Exclusive Menu Example")
        self.label = QLabel("Selected: No filtering", self)
        self.setCentralWidget(self.label)

        # Menu bar and Settings menu
        menubar = self.menuBar()
        settings_menu = menubar.addMenu("Settings")

        # "Data Processing Algorithms" submenu
        algorithms_menu = settings_menu.addMenu("Data Processing Algorithms")

        # Create an exclusive action group
        algo_group = QActionGroup(self)
        algo_group.setExclusive(True)

        # Add options
        self.no_filtering = QAction("No filtering", self, checkable=True)
        self.window_lpf = QAction("Window LPF", self, checkable=True)
        self.hmm_viterbi = QAction("HMM Viterbi", self, checkable=True)

        # Add actions to the group (for mutual exclusivity)
        for action in [self.no_filtering, self.window_lpf, self.hmm_viterbi]:
            algo_group.addAction(action)
            algorithms_menu.addAction(action)

        # Set default checked option
        self.no_filtering.setChecked(True)

        # Connect to group signal
        algo_group.triggered.connect(self.on_algorithm_selected)

    def on_algorithm_selected(self, action):
        self.label.setText(f"Selected: {action.text()}")

if __name__ == "__main__":
    app = QApplication([])
    window = MainWindow()
    window.show()
    app.exec()
