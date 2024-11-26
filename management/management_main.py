from ui_Smart_Shelving_System import Ui_MainWindow
import sys, os
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QPushButton
from PyQt6 import uic
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

def get_google_sheet_data(spreadsheet_id, sheet_name):
    # Authenticate with the Google Sheets API
    creds = Credentials.from_service_account_file(os.getenv("CREDENTIALS_PATH"))
    service = build('sheets', 'v4', credentials=creds)

    range_name = f'{sheet_name}'
    
    # Call the Sheets API to get all data in the sheet
    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
    values = result.get('values', [])
    
    return values


class GoogleSheetTableApp(QMainWindow):
    def __init__(self, data, spreadsheet_id, sheet_name):
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)

        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name
        self.changes = [] # List to track changes

        # Access the QTableWidget & save button from the .ui file by its object name
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.save_button = self.findChild(QPushButton, 'saveButton')

        self.table_widget.setRowCount(len(data))
        self.table_widget.setColumnCount(len(data[0]))

        # Populate the table
        for row_index, row_data in enumerate(data):
            for col_index, cell_data in enumerate(row_data):
                self.table_widget.setItem(row_index, col_index, QTableWidgetItem(cell_data))

        self.table_widget.cellChanged.connect(self.record_change)
        self.save_button.clicked.connect(self.push_changes_to_sheet)

    def record_change(self, row, column):
        updated_value = self.table_widget.item(row, column).text()

        self.changes.append((row, column, updated_value))

    def push_changes_to_sheet(self):
        if not self.changes:
            return
        
        requests = []
        for row, column, value in self.changes:
            column_letter = chr(65 + column) # map column index to letter
            cell_range = f'{self.sheet_name}!{column_letter}{row+1}' # Convert to A1 notation

            requests.append({
                "range": cell_range,
                "values": [[value]]
            })

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

        self.changes.clear()

# Initialize the app with the fetched data
if __name__ == '__main__':
    app = QApplication(sys.argv)

    # Fetch data from Google Sheets
    spreadsheet_id = '1fxyyb80V8hgieRpf1MKA9erwP-kD0SLwm6hdXIoRQ4M'
    sheet_name = 'Sheet1'
    data = get_google_sheet_data(spreadsheet_id, sheet_name)
        
    # Create the main window
    window = GoogleSheetTableApp(data, spreadsheet_id, sheet_name)
    window.show()

    sys.exit(app.exec())