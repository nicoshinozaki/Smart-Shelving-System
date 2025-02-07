from ui_Smart_Shelving_System import Ui_MainWindow
import sys, os, logging, traceback, time
from PyQt6.QtWidgets import QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QPushButton, QHeaderView, QMessageBox, QStatusBar
from PyQt6 import uic, QtGui, QtCore
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import numpy as np
import serial
import serial.tools.list_ports

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

class ConsoleCommandHandler(WorkerThread):
    def __init__(self, application, cmd = ""):
        self.stop = False
        parts = cmd.split()
        self.command = parts[0]
        if hasattr(self, f"{self.command}_handler") and callable(getattr(self, f"{self.command}_handler")):
            handler = getattr(self, f"{self.command}_handler")
            super().__init__(handler, *parts[1:], application = application)
        else:
            handler = self.error_cmd
            super().__init__(handler, parts[0], application = application)

    def __str__(self):
        return super().__str__() + f"({self.command})"
    
    def __repr__(self):
        return super().__repr__() + f"({self.command})"

    def _resolve_variable(self, var_name):
        if var_name in globals():
            return globals()[var_name]
        elif hasattr(self.kwargs['application'], var_name):
            return getattr(self.kwargs['application'], var_name)
        else:
            return None
        
    def error_cmd(self, *args, **kwargs):
        logger.error(f"Unknown command: {args[0]}")
        return f"Unknown command: {args[0]}"
    
    def echo_handler(self, *args, **kwargs):
        """
        Usage: echo <message>
        Echoes the message back to the console. Specify any variables with a $ prefix.
        """
        list_args = list(args)
        for i, part in enumerate(list_args):
            if part[0] == '$' and len(part) > 1:
                var_name = part[1:]
                var = self._resolve_variable(var_name)
                if var is not None:
                    list_args[i] = str(var)
                else:
                    return f"Variable \"{var_name}\" not found or is None."
        return ' '.join(list_args)
    
    def quit_handler(self, *args, **kwargs):
        """
        Usage: quit
        Quits the application.
        """
        logger.info("Quitting application...")
        QtCore.QCoreApplication.quit()
        return "Exit requested"
    
    def uptime_handler(self, *args, **kwargs):
        """
        Usage: uptime
        Displays the application's uptime in days, hours, minutes, and seconds.
        """
        uptime = time.time() - kwargs['application'].start_time
        days = int(uptime // 86400)
        hrs = int((uptime - days * 86400) // 3600)
        mins = int((uptime - days * 86400 - hrs * 3600) // 60)
        secs = uptime - days * 86400 - hrs * 3600 - mins * 60
        return f"Uptime: {days} days, {hrs} hours, {mins} minutes, {secs:.2f} seconds"
    
    def fetch_handler(self, *args, **kwargs):
        """
        Usage: fetch <spreadsheet_id> <sheet_name>
        Fetches data from the specified Google Sheets spreadsheet.
        """
        if len(args) < 2:
            return "Usage: fetch <spreadsheet_id> <sheet_name>"
        try:
            sheet_id = args[0]
            sheet_name = args[1]
            if args[0].startswith('$') and len(args[0]) > 1:
                sheet_id = self._resolve_variable(args[0][1:])
                if sheet_id is None:
                    return f"Variable \"{args[0]}\" not found or is None."
            if args[1].startswith('$') and len(args[1]) > 1:
                sheet_name = self._resolve_variable(args[1][1:])
                if sheet_name is None:
                    return f"Variable \"{args[1]}\" not found or is None."        
            data = kwargs['application'].fetch_sheets(sheet_id, sheet_name)
            output = "\n".join(["\t".join(row) for row in data])
            return "Successfully fetched data from Google Sheets\n" + output
        except Exception as e:
            logger.error("Failed to fetch data from Google Sheets")
            logger.error(e)
            return "Failed to fetch data from Google Sheets\n" + str(e)
        
    def globals_handler(self, *args, **kwargs):
        """
        Usage: globals
        Displays all global variables in the application.
        """
        output = "Globals:\n"
        for key, value in globals().items():
            output += f"{key}:\t{value}\n"
        return output
    
    def app_attrs_handler(self, *args, **kwargs):
        """
        Usage: app_attrs
        displays all attributes of the application object.
        """
        output = "Application Attributes:\n"
        for key, value in kwargs['application'].__dict__.items():
            output += f"{key}:\t{value}\n"
        return output
    
    def help_handler(self, *args, **kwargs):
        """
        Usage: help [command]
        Displays help information for specific commands or lists all available commands if [command] is not provided.
        """
        if len(args) == 0:
            output = "Available commands:\n"
            for key, value in self.__class__.__dict__.items():
                if key.endswith("_handler"):
                    output += f"{key[:-8]}\n"
            output += "Type 'help <command>' for more information on a specific command."
        else:
            output = ""
            for arg in args:
                if hasattr(self, f"{arg}_handler") and callable(getattr(self, f"{arg}_handler")):
                    output += f"Help for {arg}:\n"
                    output += getattr(self, f"{arg}_handler").__doc__ + "\n"
                else:
                    output += f"Unknown command: {arg}\n"
        return output
    
    def list_serial_ports_handler(self, *args, **kwargs):
        """
        Usage: list_serial_ports
        Lists all available serial ports on the system.
        """
        return "Serial Ports:\n" + "\n".join([str(port) for port in serial.tools.list_ports.comports()])
    
    def clear_handler(self, *args, **kwargs):
        """
        Usage: clear
        Clears the console display.
        """
        kwargs['application'].ConsoleDisplay.clear()
        return ""
    
    def eval_handler(self, *args, **kwargs):
        """
        Usage: eval <expression>
        Evaluates the expression and returns the result.
        """
        if len(args) < 1:
            return "Usage: eval <expression>"
        try:
            result = eval(' '.join(args))
            return str(result)
        except Exception as e:
            return f"Failed to evaluate \"{' '.join(args)}\"\n" + str(e)
        
    def listen_handler(self, *args, **kwargs):
        """
        Usage: listen <port> [dummy_data]
        Listens on the specified serial port and displays the received data.
        Specify dummy_data to simulate data if no serial port is available.
        """
        if len(args) < 1:
            return "Usage: listen <port> [dummy_data]"
        try:
            if len(args) > 1:
                self.port = args[0]
                while not self.stop:
                    self.signals.result.emit(self.port + ":\t" + ' '.join(args[1:]))
                    time.sleep(1)
            else:
                port = args[0]
                if args[0].startswith('$') and len(args[0]) > 1:
                    port = self._resolve_variable(args[0][1:])
                    if port is None:
                        return f"Variable \"{args[0]}\" not found or is None."
                self.port = port
                for worker in kwargs['application'].console_workers:
                    if worker.command == "listen" and worker.args[0] == port and worker != self:
                        return f"Already listening on port \"{port}\""
                ser = serial.Serial(port)
                while not self.stop:
                    self.signals.result.emit(port + ":\t" + ser.readline().decode('utf-8'))
                ser.close()
        except Exception as e:
            return f"Failed to listen on port \"{port}\"\n" + str(e)
        
    def stop_listen_handler(self, *args, **kwargs):
        """
        Usage: stop_listen [port]
        Stops listening on the specified serial ports. If no port is provided, stops all listeners.
        """
        if len(args) < 1:
            for worker in kwargs['application'].console_workers:
                if worker.command == "listen":
                    worker.stop = True
            return "Stopped all serial listeners"
        for worker in kwargs['application'].console_workers:
            if worker.command == "listen":
                if worker.port in args:
                    worker.stop = True
                    self.signals.result.emit(f"Stopped listening on port \"{worker.port}\"")

class PeripheralManager(WorkerThread):
    def __init__(self):
        self.stop = False
        super().__init__(self.peripheral_manager)

    def peripheral_manager(self):
        i = 0
        while not self.stop:
            if i % 20 == 0:
                self.signals.result.emit("Peripheral Manager is running...")
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
        self.start_time = time.time()
        super().__init__()
        uic.loadUi('src/Smart_Shelving_System.ui', self)
        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name

        # Access the console widgets
        self.ConsoleDisplay = self.findChild(QtWidgets.QPlainTextEdit, 'ConsoleDisplay')
        self.ConsoleInput = self.findChild(QtWidgets.QLineEdit, 'ConsoleInput')

        # Recover console history
        if os.path.exists("console_history.txt"):
            with open("console_history.txt", "r") as f:
                console_history = f.read()
                self.ConsoleDisplay.setPlainText(console_history)
            self.append_console_output("Console history recovered at " + time.ctime())
            self.ConsoleDisplay.moveCursor(QtGui.QTextCursor.MoveOperation.End)

        # Initialize a thread pool for background tasks
        self.threadpool = QtCore.QThreadPool()
        threading_info =f"Multithreading with maximum {self.threadpool.maxThreadCount()} threads"
        logger.info(threading_info)
        self.append_console_output(threading_info)

        # Initialize stacks to track edit changes
        self.undo_stack = []
        self.redo_stack = []

        # Access the QTableWidget, QPushButtons, QStatusBar, and console widgets from the .ui file by their object names
        self.table_widget = self.findChild(QTableWidget, 'tableWidget')
        self.save_button = self.findChild(QPushButton, 'saveButton')
        self.reload_button = self.findChild(QPushButton, 'reloadButton')
        self.statusbar = self.findChild(QStatusBar, 'statusbar')

        # Save color values for later use
        self.colors = {
            'base': self.table_widget.palette().base(),
            'alternateBase': self.table_widget.palette().alternateBase(),
            'brightText': self.table_widget.palette().brightText(),
            'text': self.table_widget.palette().text()
        }

        # Load table data from Google Sheets
        try:
            data = self.fetch_sheets(spreadsheet_id, sheet_name)
        except Exception as e:
            logger.error("Failed to fetch initial Google Sheets data")
            logger.error(e)
            self.append_console_output("Failed to fetch initial Google Sheets data")
            self.append_console_output(e)
            # TODO: Display an error message
            # This should not be recoverable
            sys.exit(-1)
        self.load_table(data)

        # Start peripheral manager in background
        #self.peripheral_thread = PeripheralManager()
        #self.peripheral_thread.signals.result.connect(self.peripheral_handler)
        #self.threadpool.start(self.peripheral_thread)

        # Console workers list
        self.console_workers = []

        # Connect signals to slots for table operations
        self.table_widget.cellChanged.connect(self.record_change)
        self.save_button.clicked.connect(self.save)
        self.reload_button.clicked.connect(self.reload_table)
        self.actionSave.triggered.connect(self.save)
        self.actionUndo.triggered.connect(self.undo)
        self.actionRedo.triggered.connect(self.redo)

        # **Connect the console input widget to our command handler**
        self.ConsoleInput.returnPressed.connect(self.handle_console_command)

        self.statusbar.showMessage("Ready")
        logger.info("Initialized Google Sheet Table App")
        self.append_console_output("Initialized Google Sheet Table App")
        self.append_console_output("Type 'help' for a list of available commands")

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
        response = QMessageBox.critical(
            self,
            "Close Application?",
            "Are you sure you want to close the application? Any unsaved changes will be lost.",
            QMessageBox.StandardButton.Ok | QMessageBox.StandardButton.Cancel
        )
        if response == QMessageBox.StandardButton.Ok:
            #self.peripheral_thread.stop = True
            for worker in self.console_workers:
                worker.stop = True
            self.append_console_output("Stopping all jobs...")
            all_stopped = self.threadpool.waitForDone(1000)
            if not all_stopped:
                logger.error("Failed to stop all threads")
                self.append_console_output("Failed to stop all threads")
            console_text = self.ConsoleDisplay.toPlainText()
            with open("console_history.txt", "w") as f:
                f.write(console_text + '\n')
                f.write("The application was closed at ")
                f.write(time.ctime() + '\n')
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

        # Set font and resize modes
        font = QtGui.QFont()
        font.setPointSize(14)
        self.table_widget.setFont(font)
        self.table_widget.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_widget.verticalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        for row in range(len(data)-1):
            brush = self.colors['base'] if row % 2 else self.colors['alternateBase']
            for col in range(len(data[0])-1):
                self.table_widget.setItem(row, col, QTableWidgetItem())
                self.table_widget.item(row, col).setTextAlignment(
                    QtCore.Qt.AlignmentFlag.AlignRight | QtCore.Qt.AlignmentFlag.AlignVCenter)
                self.table_widget.item(row, col).setBackground(brush)
                
        for row_index, row_data in enumerate(data):
            if (row_index-1) % 2:
                brush = self.colors['base']
            else:
                brush = self.colors['alternateBase']
            for col_index, cell_data in enumerate(row_data):
                if row_index == 0:
                    if col_index == 0:
                        continue
                    self.table_widget.setHorizontalHeaderItem(col_index - 1, QTableWidgetItem(cell_data))
                elif col_index == 0:
                    self.table_widget.setVerticalHeaderItem(row_index - 1, QTableWidgetItem(cell_data))
                    self.table_widget.verticalHeaderItem(row_index - 1).setBackground(brush)
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
            self.table_widget.item(row, column).setForeground(self.colors['brightText'])
        else:
            self.table_widget.item(row, column).setForeground(self.colors['text'])
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
            self.table_widget.item(row, column).setForeground(self.colors['brightText'])
        else:
            self.table_widget.item(row, column).setForeground(self.colors['text'])
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
            self.table_widget.item(row, column).setForeground(self.colors['brightText'])
        else:
            self.table_widget.item(row, column).setForeground(self.colors['text'])
        self.table_widget.cellChanged.connect(self.record_change)

    def save(self):
        self.statusbar.showMessage("Saving changes")
        self.append_console_output("Saving changes")
        self.save_button.setEnabled(False)
        self.reload_button.setEnabled(False)
        self.table_widget.setEnabled(False)
        worker = WorkerThread(self.push_sheets)
        worker.signals.finished.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.finished.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.finished.connect(lambda: self.statusbar.showMessage("Changes saved to google"))
        worker.signals.finished.connect(lambda: self.append_console_output("Changes saved to google"))
        worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
        worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
        worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
        worker.signals.error.connect(lambda e: logger.error(e))
        worker.signals.error.connect(lambda e: self.append_console_output(e))
        worker.signals.error.connect(lambda: QMessageBox.critical(self, "Error", "Failed to save changes."))
        worker.signals.error.connect(lambda: self.statusbar.showMessage("Failed to save changes"))
        worker.signals.error.connect(lambda: self.append_console_output("Failed to save changes"))
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
            self.append_console_output("Reloading table")
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
            worker.signals.finished.connect(lambda: self.append_console_output("Table reloaded"))
            worker.signals.error.connect(lambda: self.table_widget.setEnabled(True))
            worker.signals.error.connect(lambda: self.reload_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.save_button.setEnabled(True))
            worker.signals.error.connect(lambda: self.table_widget.cellChanged.connect(self.record_change))
            worker.signals.error.connect(lambda e: logger.warning(e))
            worker.signals.error.connect(lambda e: self.append_console_output(e))
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
            self.table_widget.item(row, column).setForeground(self.colors['text'])
        self.table_initial_state = self.table_current_state.copy()

        logger.info("Pushed changes to Google Sheets")
        logger.info(deltas)
        logger.info(self.table_current_state)

    def handle_console_command(self):
        """
        Reads the command from ConsoleInput and processes it.
        Only the 'echo' command is supported for now.
        """
        command_text = self.ConsoleInput.text().strip()
        # Clear the input after reading
        self.ConsoleInput.clear()
        
        if not command_text:
            return

        # Create a worker for the command
        worker = ConsoleCommandHandler(self, cmd = command_text)
        self.console_workers.append(worker)
        worker.signals.result.connect(self.append_console_output)
        worker.signals.finished.connect(lambda: self.console_workers.remove(worker))
        worker.signals.error.connect(lambda e: self.append_console_output("Uncaught exception during execution:\n" + str(e)))
        worker.signals.error.connect(lambda e: logger.error(e))
        self.threadpool.start(worker)

    def append_console_output(self, text):
        """
        Append text to the ConsoleDisplay widget.
        """
        self.ConsoleDisplay.appendPlainText(text)

if __name__ == '__main__':
    import logging
    from PyQt6 import QtWidgets  # Ensure QtWidgets is imported for widget lookup

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
