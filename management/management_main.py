import sys, os, logging, time, platform
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QPushButton, QHeaderView, QMessageBox, QStatusBar, QPlainTextEdit, QLineEdit, QWidget, QScroller, QScrollerProperties
from PyQt6 import uic, QtGui, QtCore
from PyQt6.QtGui import QColor, QBrush, QActionGroup
from PyQt6.QtCore import QEvent, Qt
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from serial.tools.list_ports import comports
import numpy as np
from Workers import WorkerThread
from Console import Console
from ScannerDriver import ScannerDriver, FilterMethod
from ZebraSerialConfig import ZebraSerialConfig
import json
import subprocess
logger = logging.getLogger(__name__)

class GoogleSheetTableApp(QMainWindow):
    """
    A QMainWindow-based application that manages a Google Sheets-backed table with a rich user interface.
    This application loads table data from a specified Google Sheet and provides features such as:
        - Displaying and editing table data in a QTableWidget.
        - Automatic and manual saving of changes back to Google Sheets.
        - Undo/redo functionality for cell edits.
        - UI elements including a console for output, buttons for saving and reloading, and status messages.
        - Background processing via QThreadPool for long-running tasks (e.g., fetching data and configuring connected devices).
        - Peripheral device configuration (e.g., Zebra RFID reader) and scanning capabilities.
        - Maintaining application settings such as auto_save, warn_inventory_change, and save_on_exit to control behavior.
    Parameters:
        spreadsheet_id (str): The ID of the Google Sheet to interact with.
        sheet_name (str): The name of the sheet within the Google Sheet document containing table data.
        settings (dict, optional): A dictionary to override default settings. Possible keys include:
            - 'auto_save': (bool) whether changes are automatically saved.
            - 'warn_inventory_change': (bool) whether to warn when inventory changes are detected.
            - 'save_on_exit': (bool) whether to save changes automatically upon application exit.
    The class also handles:
        - Initialization of UI components (widgets from the .ui file).
        - Loading of initial configurations including previous scan results if available.
        - Synchronization of table state with Google Sheets through methods like fetch_sheets, load_table, and push_sheets.
        - Undo/redo mechanisms through the maintenance of an undo_stack and redo_stack.
        - Background tasks using worker threads to keep the UI responsive during long operations.
        - Peripheral (scanner) management with a dedicated thread and real-time status updates.
        - Cleanup and saving of application state on close via a custom closeEvent.
    Usage:
        Instantiate the class with the appropriate spreadsheet_id, sheet_name, and optional settings dictionary. The application will configure the UI,
        fetch initial data from Google Sheets, and start background services such as device configuration and scanning once launched.
    """
    def __init__(self, spreadsheet_id:str, sheet_name:str, settings:dict = {}):
        self.start_time = time.time()
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)
        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name
        self.settings = settings

        # Initialize the console
        # Access the console widgets
        self.ConsoleDisplay = self.findChild(QPlainTextEdit, 'ConsoleDisplay')
        self.ConsoleDisplay.setReadOnly(True)
        self.ConsoleDisplay.setTextInteractionFlags(Qt.TextInteractionFlag.NoTextInteraction)
        gesture_type = getattr(QScroller, 'ScrollerGestureType')
        QScroller.grabGesture(self.ConsoleDisplay.viewport(), gesture_type.LeftMouseButtonGesture)
        scroller = QScroller.scroller(self.ConsoleDisplay.viewport())
        props = scroller.scrollerProperties()
        props.setScrollMetric(QScrollerProperties.ScrollMetric.DecelerationFactor, 1)
        props.setScrollMetric(QScrollerProperties.ScrollMetric.MaximumVelocity, 0.1)
        scroller.setScrollerProperties(props)
        self.ConsoleInput = self.findChild(QLineEdit, 'ConsoleInput')
        self.console = Console(self, self.ConsoleDisplay, self.ConsoleInput)

        # print settings
        if settings:
            for key, value in settings.items():
                logger.info(f"{key}: {value}")
                self.console.append_output(f"{key}: {value}")
        else:
            logger.info("No settings provided, using default settings")
            self.console.append_output("No settings provided, using default settings")

        # Initialize a thread pool for background tasks
        self.threadpool = QtCore.QThreadPool()
        threading_info =f"Multithreading with maximum {self.threadpool.maxThreadCount()} threads"
        logger.info(threading_info)
        self.console.append_output(threading_info)

        # Initialize stacks to track edit changes
        self.undo_stack = []
        self.redo_stack = []

        # Access the QTableWidget, QPushButtons, QStatusBar, and console widgets from the .ui file by their object names
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.save_button = self.findChild(QPushButton, 'saveButton')
        self.reload_button = self.findChild(QPushButton, 'reloadButton')
        self.statusbar = self.findChild(QStatusBar, 'statusbar')

        # initialize settings menu
        self.actionAuto_save.setChecked(settings.get('auto_save', True))
        self.actionWarn_inventory_change.setChecked(settings.get('warn_inventory_change', True))
        self.actionSave_on_exit.setChecked(settings.get('save_on_exit', True))
        self.actionSave_on_exit.toggled.connect(self.toggle_save_on_exit)
        self.actionAuto_save.toggled.connect(self.toggle_auto_save)
        self.actionWarn_inventory_change.toggled.connect(self.toggle_warn_inventory_change)

        # Create an algorithm select action group
        self.algorithm_group = QActionGroup(self)
        self.algorithm_group.setExclusive(True)
        self.algorithm_group.addAction(self.actionNone)
        self.algorithm_group.addAction(self.actionLPF_window)
        self.algorithm_group.addAction(self.actionHMM_Viterbi)
        self.actionNone.setChecked(True)
        self.algorithm_group.triggered.connect(self.change_algorithm)

        # Save color values for later use
        current_os = platform.system()

        self.table_colors = {
            'brightText': QBrush(QColor(255, 0, 0)), # red
            'text': self.table_widget.palette().text()
        }

        # Load table data from Google Sheets
        try:
            data = self.fetch_sheets(spreadsheet_id, sheet_name)
        except Exception as e:
            logger.error("Failed to fetch initial Google Sheets data")
            logger.error(e)
            self.console.append_output("Failed to fetch initial Google Sheets data")
            self.console.append_output(e)
            # TODO: Display an error message
            # This should not be recoverable
            sys.exit(-1)
        self.load_table(data)

        # Start peripheral manager in background
        #self.peripheral_thread = PeripheralManager()
        #self.peripheral_thread.signals.result.connect(self.peripheral_handler)
        #self.threadpool.start(self.peripheral_thread)

        # Connect signals to slots for table operations
        self.table_widget.cellChanged.connect(self.record_change)
        self.save_button.clicked.connect(self.save)
        self.reload_button.clicked.connect(self.reload_table)
        self.actionSave.triggered.connect(self.save)
        self.actionUndo.triggered.connect(self.undo)
        self.actionRedo.triggered.connect(self.redo)

        self.statusbar.showMessage("Ready")
        logger.info("Initialized Google Sheet Table App")
        self.console.append_output("Initialized Google Sheet Table App")
        self.console.append_output("Type 'help' for a list of available commands")
        
        zebra_config_thread = WorkerThread(self.zebra_serial_config)
        zebra_config_thread.signals.finished.connect(lambda: self.start_scanner())
        self.threadpool.start(zebra_config_thread)
        self.console.append_output("Configuring Zebra RFID reader...")

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
    
    def change_algorithm(self, action):
        if action == self.actionNone:
            self.console.append_output("No filtering selected")
            self.scanner.change_filter_method(FilterMethod.NoFiltering)
        elif action == self.actionLPF_window:
            self.console.append_output("LPF filtering selected")
            self.scanner.change_filter_method(FilterMethod.WindowLPF)
        elif action == self.actionHMM_Viterbi:
            self.console.append_output("HMM-Viterbi filtering selected")
            self.scanner.change_filter_method(FilterMethod.HMMViterbi)
    
    def toggle_auto_save(self):
        if self.settings.get('auto_save', True):
            self.settings['auto_save'] = False
            self.actionAuto_save.setChecked(False)
            self.console.append_output("Auto save disabled")
        else:
            self.settings['auto_save'] = True
            self.actionAuto_save.setChecked(True)
            self.console.append_output("Auto save enabled")

    def toggle_warn_inventory_change(self):
        if self.settings.get('warn_inventory_change', True):
            self.settings['warn_inventory_change'] = False
            self.actionWarn_inventory_change.setChecked(False)
            self.console.append_output("Warning for inventory change disabled")
        else:
            self.settings['warn_inventory_change'] = True
            self.actionWarn_inventory_change.setChecked(True)
            self.console.append_output("Warning for inventory change enabled")

    def toggle_save_on_exit(self):
        if self.settings.get('save_on_exit', True):
            self.settings['save_on_exit'] = False
            self.actionSave_on_exit.setChecked(False)
            self.console.append_output("Save on exit disabled")
        else:
            self.settings['save_on_exit'] = True
            self.actionSave_on_exit.setChecked(True)
            self.console.append_output("Save on exit enabled")
    
    def zebra_serial_config(self):
        retried = 0
        while True:
            try:
                with open("zebra.conf", "r") as f:
                    config = {}
                    for line in f:
                        key, value = line.strip().split('=', 1)
                        config[key.strip()] = value.strip()
                    chromedriver_path = config.get('chromedriver_path')
                    url = config.get('url')
                    password = config.get('password')
                zebra_interface = ZebraSerialConfig(chromedriver_path, url, password)
                self.update_status("Configuring Zebra RFID reader...")
                zebra_interface.connect()
                self.update_status("Ready")
                self.console.append_output("Zebra RFID reader successfully configured")
                return
            except Exception as e:
                retried += 1
                self.update_status(f"Retrying Zebra configuration...{retried+1}/3")
                time.sleep(1)
                if retried == 2:
                    self.console.append_output("Failed to configure Zebra RFID reader\n" + str(e))
                    self.update_status("Zebra reader configuration failed\n")
                    return
    
    def update_status(self, message):
        self.statusbar.showMessage(message)

    def closeEvent(self, event):
        response = QMessageBox.critical(
            self,
            "Close Application?",
            "Are you sure you want to close the application? Any unsaved changes will be lost.",
            QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel
        )
        if response == QMessageBox.StandardButton.Ok:
            self.scanner.signals.finished.disconnect()
            self.scanner.stop()
            if self.settings.get('save_on_exit', True):
                self.console.append_output("Saving changes on exit")
                self.save()
            self.console.append_output("Stopping all console jobs...")
            all_stopped = self.console.stop()
            if not all_stopped:
                logger.error("Failed to stop all console jobs")
                self.console.append_output("Failed to stop all console jobs")
            if not all_stopped:
                logger.error("Failed to stop all threads")
                self.console.append_output("Failed to stop all threads")
            console_text = self.ConsoleDisplay.toPlainText()
            with open("console_history.txt", "w") as f:
                f.write(console_text + '\n')
                f.write("The application was closed at ")
                f.write(time.ctime() + '\n')
            with open("settings.json", "w") as f:
                json.dump(self.settings, f, indent=4)
            self.console.append_output("Stopping all application jobs...")
            all_stopped = self.threadpool.waitForDone(10000)
            event.accept()
        else:
            event.ignore()

    def peripheral_handler(self, *args, **kwargs):
        # Display the peripheral message in a non-blocking message box.
        # Alternatively, you could also print it to the debug console.
        QMessageBox.information(self, "Peripheral Message", args[0])

    def load_table(self, data):
        self.table_widget.setRowCount(len(data)-1)
        self.table_widget.setColumnCount(len(data[0])-1)
        
        # Initialize table state variables
        self.table_initial_state = np.ndarray((len(data)-1, len(data[0])-1,), dtype=object)
        self.table_current_state = self.table_initial_state.copy()

        self.table_widget.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_widget.verticalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_widget.setAlternatingRowColors(True)
        for row in range(len(data)-1):
            #brush = self.colors['base'] if row % 2 else self.colors['alternateBase']
            for col in range(len(data[0])-1):
                self.table_widget.setItem(row, col, QTableWidgetItem())
                self.table_widget.item(row, col).setTextAlignment(
                    QtCore.Qt.AlignmentFlag.AlignRight | QtCore.Qt.AlignmentFlag.AlignVCenter)
                #self.table_widget.item(row, col).setBackground(brush)
                
        for row_index, row_data in enumerate(data):
            #if (row_index-1) % 2:
            #    brush = self.colors['base']
            #else:
            #    brush = self.colors['alternateBase']
            for col_index, cell_data in enumerate(row_data):
                if row_index == 0:
                    if col_index == 0:
                        continue
                    self.table_widget.setHorizontalHeaderItem(col_index - 1, QTableWidgetItem(cell_data))
                elif col_index == 0:
                    self.table_widget.setVerticalHeaderItem(row_index - 1, QTableWidgetItem(cell_data))
                    #self.table_widget.verticalHeaderItem(row_index - 1).setBackground(brush)
                else:
                    self.table_widget.item(row_index - 1, col_index - 1).setText(cell_data)
                    self.table_initial_state[row_index - 1][col_index - 1] = cell_data
                    self.table_current_state[row_index - 1][col_index - 1] = cell_data

    def record_change(self, row, column, value = None, nosave = False):
        previous_value = self.table_current_state[row][column]
        new_value = (self.table_widget.item(row, column).text() if value is None else str(value))

        if previous_value == new_value:
            return
        self.table_widget.cellChanged.disconnect()
        self.redo_stack.clear()
        if self.table_initial_state[row, column] != new_value:
            self.table_widget.item(row, column).setForeground(self.table_colors['brightText'])
            if value is not None:
                self.table_widget.item(row, column).setText(new_value)
        else:
            self.table_widget.item(row, column).setForeground(self.table_colors['text'])
        self.undo_stack.append((row, column, previous_value))
        self.table_current_state[row, column] = new_value
        self.table_widget.cellChanged.connect(self.record_change)
        if nosave:
            return
        if self.settings.get('auto_save', True):
            self.save()

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
            self.table_widget.item(row, column).setForeground(self.table_colors['brightText'])
        else:
            self.table_widget.item(row, column).setForeground(self.table_colors['text'])
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
            self.table_widget.item(row, column).setForeground(self.table_colors['brightText'])
        else:
            self.table_widget.item(row, column).setForeground(self.table_colors['text'])
        self.table_widget.cellChanged.connect(self.record_change)

    def save(self):
        self.statusbar.showMessage("Saving changes")
        self.console.append_output("Saving changes")
        self.save_button.setEnabled(False)
        self.reload_button.setEnabled(False)
        self.table_widget.setEnabled(False)
        worker = WorkerThread(self.push_sheets)
        worker.signals.finished.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.finished.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.statusbar.showMessage("Changes saved to google"))
        worker.signals.finished.connect(lambda: self.console.append_output("Changes saved to google"))
        worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.error.connect(lambda e: logger.error(e))
        worker.signals.error.connect(lambda e: self.console.append_output(e))
        worker.signals.error.connect(lambda: QMessageBox.critical(self, "Error", "Failed to save changes."))
        worker.signals.error.connect(lambda: self.statusbar.showMessage("Failed to save changes"))
        worker.signals.error.connect(lambda: self.console.append_output("Failed to save changes"))
        self.threadpool.start(worker)

    def reload_table(self):
        response = QMessageBox.critical(
            self,
            "Reload Table?",
            "Are you sure you want to reload the table? This cannot be undone.",
            QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel
        )
        if response == QMessageBox.StandardButton.Ok:
            logger.info("Reloading table")
            self.console.append_output("Reloading table")
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
            worker.signals.finished.connect(lambda: self.console.append_output("Table reloaded"))
            worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
            worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.table_widget.cellChanged.connect(self.record_change))
            worker.signals.error.connect(lambda e: logger.warning(e))
            worker.signals.error.connect(lambda e: self.console.append_output(e))
            worker.signals.error.connect(lambda: QMessageBox.warning(self, "Warning", "Failed to reload table."))
            worker.signals.error.connect(lambda: self.statusbar.showMessage("Failed to reload table"))
            
            self.undo_stack.clear()
            self.redo_stack.clear()
            self.threadpool.start(worker)
        else:
            return
        
    def handle_scan_results(self, results:dict):
        if not results:
            return
        # Scanner is paused when results are received
        if self.settings.get('warn_inventory_change', True):
            response = QMessageBox.critical(
                self,
                "Inventory Changed",
                f"Inventory changed for drawers {results.keys()}, Record changes?",
                QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel
            )

            if response == QMessageBox.StandardButton.Cancel:
                self.console.append_output("Changes not recorded")
                self.scanner.start()
                return

        self.console.append_output("Changed drawers:")
        for antenna_num in results:
            self.console.append_output(f"\tAntenna {antenna_num}:{results[antenna_num]}\ttags")
            self.record_change(antenna_num, 1, results[antenna_num], nosave=True)
        if self.settings.get('auto_save', True):
            self.console.append_output("Auto saving changes")
            self.save()
        # Restart the scanner
        self.scanner.start()

    def start_scanner(self):
        current_os = platform.system()
        if (current_os == "Darwin"):
            self.scanner = ScannerDriver(self, device = '/dev/tty.usbserial-A9Z2MKOX',
                                        antenna_count = 4,
                                        scan_time = 2,
                                        window_size = 3)
        elif (current_os == "Linux"):
            self.scanner = ScannerDriver(self, device = '/dev/ttyUSB0',
                                        antenna_count = 4,
                                        scan_time = 2,
                                        window_size = 3)
        self.scanner.signals.error.connect(lambda e: self.console.append_output(str(e)))
        self.scanner.signals.finished.connect(lambda: self.console.append_output("Scanner stopped on critical error, restart required."))
        self.scanner.signals.result.connect(self.handle_scan_results)
        self.console.append_output("Scanner started")
        self.threadpool.start(self.scanner)

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
            self.table_widget.item(row, column).setForeground(self.table_colors['text'])
        self.table_initial_state = self.table_current_state.copy()

        logger.info("Pushed changes to Google Sheets")
        logger.info(deltas)
        logger.info(self.table_current_state)
  

if __name__ == '__main__':
    import logging
    from PyQt6 import QtWidgets  # Ensure QtWidgets is imported for widget lookup

    logging.basicConfig(filename='management.log',
                        filemode='w',
                        level=logging.INFO)
    
    app = QApplication(sys.argv)

    try:
        with open("settings.json", "r") as f:
            settings = json.load(f)
    except FileNotFoundError:
        settings = {}
    spreadsheet_id = '1fxyyb80V8hgieRpf1MKA9erwP-kD0SLwm6hdXIoRQ4M'
    sheet_name = 'Sheet1'

    # Create the main window
    window = GoogleSheetTableApp(spreadsheet_id, sheet_name, settings)
    window.showMaximized()

    sys.exit(app.exec())
