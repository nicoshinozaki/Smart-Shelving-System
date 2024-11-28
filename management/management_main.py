from ui_Smart_Shelving_System import Ui_MainWindow
import sys, os, logging, traceback, time
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QPushButton, QHeaderView, QMessageBox, QStatusBar
from PyQt6 import uic, QtGui, QtCore
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import numpy as np

logger = logging.getLogger(__name__)

class WorkerSignals(QtCore.QObject):
    finished = QtCore.pyqtSignal()
    error = QtCore.pyqtSignal(tuple)
    result = QtCore.pyqtSignal(object)

class WorkerThread(QtCore.QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = WorkerSignals()

    @QtCore.pyqtSlot()
    def run(self):
        try:
            self.signals.result.emit(self.fn(*self.args, **self.kwargs))
        except Exception as e:
            self.signals.error.emit((e, traceback.format_exc()))
        self.signals.finished.emit()

class PeripheralManager(WorkerThread):
    def __init__(self):
        self.stop = False
        super().__init__(self.peripheral_manager)

    def peripheral_manager(self):
        i = 0
        while not self.stop:
            if i % 20 == 0: self.signals.result.emit("Peripheral Manager is running...")
            time.sleep(1)
            i += 1

class GoogleSheetTableApp(QMainWindow):
    """
    A PyQt5 application for managing and editing Google Sheets data in a table format.
    Attributes:
        spreadsheet_id (str): The ID of the Google Sheets spreadsheet.
        sheet_name (str): The name of the sheet within the spreadsheet.
        threadpool (QThreadPool): A thread pool for managing background tasks.
        undo_stack (list): A stack to track undo changes.
        redo_stack (list): A stack to track redo changes.
        table_widget (QTableWidget): The table widget displaying the Google Sheets data.
        save_button (QPushButton): The button to save changes to Google Sheets.
        reload_button (QPushButton): The button to reload the table data from Google Sheets.
        statusbar (QStatusBar): The status bar to display messages.
        peripheral_thread (PeripheralManager): A thread to manage peripheral tasks.
        table_initial_state (np.ndarray): The initial state of the table data.
        table_current_state (np.ndarray): The current state of the table data.
    Methods:
        fetch_sheets(spreadsheet_id, sheet_name):
            Fetches data from the specified Google Sheets spreadsheet and sheet.
        closeEvent(event):
            Handles the close event of the application, prompting the user for confirmation.
        peripheral_handler(*args, **kwargs):
            Handles result signals from the peripheral manager.
        load_table(data):
            Loads data into the table widget and initializes table states.
        record_change(row, column):
            Records changes made to the table cells and updates undo/redo stacks.
        undo():
            Undoes the last change made to the table.
        redo():
            Redoes the last undone change to the table.
        save():
            Saves changes made to the table to Google Sheets.
        reload_table():
            Reloads the table data from Google Sheets, discarding unsaved changes.
        push_sheets():
            Pushes changes made to the table to Google Sheets.
    """
    def __init__(self, spreadsheet_id, sheet_name):
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)
        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name

        # Initialize a thread pool for background tasks
        self.threadpool = QtCore.QThreadPool()
        logger.info(f"Multithreading with maximum {self.threadpool.maxThreadCount()} threads")

        # Initialize stacks to track edit changes
        self.undo_stack = []
        self.redo_stack = []

        # Access the QTableWidget & save button from the .ui file by its object name
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.save_button = self.findChild(QPushButton, 'saveButton')
        self.reload_button = self.findChild(QPushButton, 'reloadButton')
        self.statusbar = self.findChild(QStatusBar, 'statusbar')

        # Load table
        try:
            data = self.fetch_sheets(spreadsheet_id, sheet_name)
        except Exception as e:
            logger.error("Failed to fetch initial Google Sheets data")
            logger.error(e)
            # TODO: Display an error message
            # This should not be recoverable
            sys.exit(-1)
        self.load_table(data)

        # Peripheral manager
        self.peripheral_thread = PeripheralManager()
        self.peripheral_thread.signals.result.connect(self.peripheral_handler)
        self.threadpool.start(self.peripheral_thread)
        

        # Connect signals to slots
        self.table_widget.cellChanged.connect(self.record_change)
        self.save_button.clicked.connect(self.save)
        self.reload_button.clicked.connect(self.reload_table)
        self.actionSave.triggered.connect(self.save)
        self.actionUndo.triggered.connect(self.undo)
        self.actionRedo.triggered.connect(self.redo)

        self.statusbar.showMessage("Ready")
        logger.info("Initialized Google Sheet Table App")

    @staticmethod
    def fetch_sheets(spreadsheet_id, sheet_name):
        # Authenticate with the Google Sheets API
        creds = Credentials.from_service_account_file(os.getenv("CREDENTIALS_PATH"))
        service = build('sheets', 'v4', credentials=creds)
        range_name = f'{sheet_name}'
        
        # Call the Sheets API to get all data in the sheet
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        
        return values

    def closeEvent(self, event):
        response = QMessageBox.critical(self,
                                        "Close Application?",
                                        "Are you sure you want to close the application? Any unsaved changes will be lost.",
                                        QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel)
        if response == QMessageBox.StandardButton.Ok:
            self.peripheral_thread.stop = True
            event.accept()
        else:
            event.ignore()

    def peripheral_handler(self, *args, **kwargs):
        QMessageBox.information(self, "Peripheral Message", args[0])

    def load_table(self, data):
        self.table_widget.setRowCount(len(data)-1)
        self.table_widget.setColumnCount(len(data[0])-1)
        
        # These state variables are used to store table data
        self.table_initial_state = np.ndarray((len(data)-1, len(data[0])-1,), dtype=object)
        self.table_current_state = self.table_initial_state.copy()

        # Populate the table and save table states
        font = QtGui.QFont()
        font.setPointSize(14)
        self.table_widget.setFont(font)
        self.table_widget.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_widget.verticalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        for row in range(len(data)-1):
            for col in range(len(data[0])-1):
                self.table_widget.setItem(row, col, QTableWidgetItem())
                self.table_widget.item(row, col).setTextAlignment(
                    QtCore.Qt.AlignmentFlag.AlignRight | QtCore.Qt.AlignmentFlag.AlignVCenter)
                shade = 50 + 10 * (row % 2)
                self.table_widget.item(row, col).setBackground(
                        QtGui.QColor(shade, shade, shade))
        for row_index, row_data in enumerate(data):
            shade = 50 + 10 * ((row_index-1) % 2)
            for col_index, cell_data in enumerate(row_data):
                if row_index == 0:
                    if col_index == 0:
                        continue
                    self.table_widget.setHorizontalHeaderItem(col_index - 1, QTableWidgetItem(cell_data))
                    self.table_widget.horizontalHeaderItem(col_index - 1).setBackground(QtGui.QColor(60, 60, 60))
                elif col_index == 0:
                    self.table_widget.setVerticalHeaderItem(row_index - 1, QTableWidgetItem(cell_data))
                    self.table_widget.verticalHeaderItem(row_index - 1).setBackground(
                        QtGui.QColor(shade, shade, shade))
                else:
                    self.table_widget.item(row_index - 1, col_index - 1).setText(cell_data)
                    self.table_initial_state[row_index - 1][col_index - 1] = cell_data
                    self.table_current_state[row_index - 1][col_index - 1] = cell_data

    def record_change(self, row, column):
        previous_value = self.table_current_state[row][column]
        new_value = self.table_widget.item(row, column).text()

        if previous_value == new_value:
            return
        self.table_widget.cellChanged.disconnect()
        self.redo_stack.clear()
        if self.table_initial_state[row, column] != new_value:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 0, 0))
        else:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 255, 255))
        self.undo_stack.append((row, column, previous_value))
        self.table_current_state[row, column] = new_value
        self.table_widget.cellChanged.connect(self.record_change)

    def undo(self):
        if not self.undo_stack:
            return
        self.statusbar.showMessage("Undo")
        change = self.undo_stack.pop()
        row, column, value = change
        self.redo_stack.append((row, column, self.table_current_state[row, column]))
        self.table_current_state[row, column] = value

        self.table_widget.cellChanged.disconnect()
        self.table_widget.item(row, column).setText(value)
        if self.table_initial_state[row][column] != value:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 0, 0))
        else:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 255, 255))
        self.table_widget.cellChanged.connect(self.record_change)

    def redo(self):
        if not self.redo_stack:
            return
        self.statusbar.showMessage("Redo")
        change = self.redo_stack.pop()
        row, column, value = change
        self.undo_stack.append((row, column, self.table_current_state[row, column]))
        self.table_current_state[row, column] = value

        self.table_widget.cellChanged.disconnect()
        self.table_widget.item(row, column).setText(value)
        if self.table_initial_state[row][column] != value:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 0, 0))
        else:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 255, 255))
        self.table_widget.cellChanged.connect(self.record_change)

    def save(self):
        self.statusbar.showMessage("Saving changes")
        self.save_button.setEnabled(False)
        self.reload_button.setEnabled(False)
        self.table_widget.setEnabled(False)
        worker = WorkerThread(self.push_sheets)
        worker.signals.finished.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.finished.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.statusbar.showMessage("Changes saved to google"))
        worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.error.connect(lambda e: logger.error(e))
        worker.signals.error.connect(lambda: QMessageBox.critical(self, "Error", "Failed to save changes."))
        worker.signals.error.connect(lambda: self.statusbar.showMessage("Failed to save changes"))
        self.threadpool.start(worker)

    def reload_table(self):
        logger.info("Reloading table")
        response = QMessageBox.critical(self,
                                        "Reload Table?",
                                        "Are you sure you want to reload the table? This cannot be undone.",
                                        QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel)
        if response == QMessageBox.StandardButton.Ok:
            worker = WorkerThread(self.fetch_sheets, self.spreadsheet_id, self.sheet_name)
            self.statusbar.showMessage("Reloading table")
            self.table_widget.setEnabled(False)
            self.reload_button.setEnabled(False)
            self.save_button.setEnabled(False)
            self.table_widget.cellChanged.disconnect()
            
            worker.signals.result.connect(self.load_table)
            worker.signals.finished.connect(lambda: self.table_widget.setEnabled(True))
            worker.signals.finished.connect(lambda: self.save_button.setEnabled(True))
            worker.signals.finished.connect(lambda: self.reload_button.setEnabled(True))
            worker.signals.finished.connect(lambda: self.table_widget.cellChanged.connect(self.record_change))
            worker.signals.finished.connect(lambda: self.statusbar.showMessage("Table reloaded"))
            worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
            worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.table_widget.cellChanged.connect(self.record_change))
            worker.signals.error.connect(lambda e: logger.warning(e))
            worker.signals.error.connect(lambda: QMessageBox.warning(self, "Warning", "Failed to reload table."))
            worker.signals.error.connect(lambda: self.statusbar.showMessage("Failed to reload table"))
            
            self.undo_stack.clear()
            self.redo_stack.clear()
            self.threadpool.start(worker)
        else:
            return

    def push_sheets(self):
        deltas = np.argwhere(self.table_initial_state != self.table_current_state)
        deltas = [(row, column, self.table_current_state[row, column]) for row, column in deltas]
        requests = []

        self.table_widget.cellChanged.disconnect()
        for row, column, value in deltas:
            column_letter = chr(65 + column + 1) # map column index to letter
            cell_range = f'{self.sheet_name}!{column_letter}{row+2}' # Convert to A1 notation
            requests.append({
                "range": cell_range,
                "values": [[value]]
            })
        self.table_widget.cellChanged.connect(self.record_change)
        
        try:
            creds = Credentials.from_service_account_file(os.getenv("CREDENTIALS_PATH"))
            service = build('sheets', 'v4', credentials=creds)
            body = {
                "data": requests,
                "valueInputOption": "USER_ENTERED"
            }
            service.spreadsheets().values().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body=body
            ).execute()
        except Exception as e:
            # TODO: Display an error message
            # This should be recoverable
            return

        for row, column, _ in deltas:
            self.table_widget.item(row, column).setForeground(QtGui.QColor(255, 255, 255))
        self.table_initial_state = self.table_current_state.copy()

        logger.info("Pushed changes to Google Sheets")
        logger.info(deltas)
        logger.info(self.table_current_state)

if __name__ == '__main__':
    logging.basicConfig(filename='management.log',
                    filemode='w',
                    level=logging.INFO)
    
    app = QApplication(sys.argv)

    spreadsheet_id = '1fxyyb80V8hgieRpf1MKA9erwP-kD0SLwm6hdXIoRQ4M'
    sheet_name = 'Sheet1'

    # Create the main window
    window = GoogleSheetTableApp(spreadsheet_id, sheet_name)
    window.show()

    sys.exit(app.exec())