from ui_Smart_Shelving_System import Ui_MainWindow
import sys, os
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget
from PyQt6 import uic
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

def get_google_sheet_data(spreadsheet_id, sheet_name):
    # Authenticate with the Google Sheets API
    creds = Credentials.from_service_account_file(os.getenv("CREDENTIALS_PATH"))
    service = build('sheets', 'v4', credentials=creds)

    # Specify just the sheet name, no specific range
    range_name = f'{sheet_name}'
    
    # Call the Sheets API to get all data in the sheet
    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
    values = result.get('values', [])
    
    return values


class GoogleSheetTableApp(QMainWindow):
    def __init__(self, data):
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)  # Load the .ui file

        # Access the QTableWidget from the .ui file by its object name
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.table_widget.setRowCount(len(data))
        self.table_widget.setColumnCount(len(data[0]))

        # Populate the table
        for row_index, row_data in enumerate(data):
            for col_index, cell_data in enumerate(row_data):
                self.table_widget.setItem(row_index, col_index, QTableWidgetItem(cell_data))

# Initialize the app with the fetched data
if __name__ == '__main__':
    app = QApplication(sys.argv)

    # Fetch data from Google Sheets
    spreadsheet_id = '1fxyyb80V8hgieRpf1MKA9erwP-kD0SLwm6hdXIoRQ4M'
    range_name = 'Sheet1!A:C'
    data = get_google_sheet_data(spreadsheet_id, range_name)
        
    # Create the main window
    window = GoogleSheetTableApp(data)
    window.show()

    sys.exit(app.exec())