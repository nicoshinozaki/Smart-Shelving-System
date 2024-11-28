from ui_Smart_Shelving_System import Ui_MainWindow
import sys, os
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QPushButton, QHeaderView, QMessageBox
from PyQt6 import uic, QtGui
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import numpy as np
import logging

class GoogleSheetTableApp(QMainWindow):
    def __init__(self, spreadsheet_id, sheet_name):
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)
        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name

        # Initialize stacks to track edit changes
        self.undo_stack = []
        self.redo_stack = []

        # Access the QTableWidget & save button from the .ui file by its object name
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.save_button = self.findChild(QPushButton, 'saveButton')
        self.reload_button = self.findChild(QPushButton, 'reloadButton')

        # Load table
        try:
            data = self.fetch_sheets(spreadsheet_id, sheet_name)
        except Exception as e:
            logging.error("Failed to fetch initial Google Sheets data")
            logging.error(e)
            # TODO: Display an error message
            # This should not be recoverable
            sys.exit(-1)
        self.load_table(data)

        # Connect signals to slots
        self.table_widget.cellChanged.connect(self.record_change)
        self.save_button.clicked.connect(self.push_sheets)
        self.reload_button.clicked.connect(self.reload_table)
        self.actionSave.triggered.connect(self.push_sheets)
        self.actionUndo.triggered.connect(self.undo)
        self.actionRedo.triggered.connect(self.redo)

        logging.info("Initialized Google Sheet Table App")

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
    
    def load_table(self, data):
        self.table_widget.setRowCount(len(data)-1)
        self.table_widget.setColumnCount(len(data[0])-1)
        
        # These state variables are used to store table data
        self.table_initial_state = np.ndarray((len(data)-1, len(data[0])-1,), dtype=object)
        self.table_current_state = self.table_initial_state.copy()

        # Populate the table and save table states
        font = QtGui.QFont()
        font.setPointSize(16)
        self.table_widget.setFont(font)
        self.table_widget.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_widget.verticalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        for row in range(len(data)-1):
            for col in range(len(data[0])-1):
                self.table_widget.setItem(row, col, QTableWidgetItem())
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

    def reload_table(self):
        logging.info("Reloading table")
        response = QMessageBox.critical(self,
                                        "Reload Table?",
                                        "Are you sure you want to reload the table? This cannot be undone.",
                                        QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel)
        if response == QMessageBox.StandardButton.Ok:
            try:
                data = self.fetch_sheets(spreadsheet_id, sheet_name)
            except Exception as e:
                logging.warning("Failed to reload table")
                logging.warning(e)
                # TODO: Display an error message
                # This should be recoverable
                return
            self.table_widget.cellChanged.disconnect()
            self.undo_stack.clear()
            self.redo_stack.clear()
            self.load_table(data)
            self.table_widget.cellChanged.connect(self.record_change)
            logging.info("Reloaded table")
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

        logging.info("Pushed changes to Google Sheets")
        logging.info(deltas)
        logging.info(self.table_current_state)

# Initialize the app with the fetched data
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