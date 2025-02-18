import time, os
import serial
import logging
from PyQt6 import QtCore, QtGui
from PyQt6.QtWidgets import QPlainTextEdit, QLineEdit
from Workers import WorkerThread

BAUD_RATE = 115200

logger = logging.getLogger(__name__)

class ConsoleCommandHandler(WorkerThread):
    def __init__(self, application, cmd = ""):
        self.stop = False
        parts = cmd.split()
        self.command = parts[0]
        self.cmd = cmd
        if hasattr(self, f"{self.command}_handler") and callable(getattr(self, f"{self.command}_handler")):
            handler = getattr(self, f"{self.command}_handler")
            super().__init__(handler, *parts[1:], application = application)
        else:
            handler = self.error_cmd
            super().__init__(handler, parts[0], application = application)

    def __str__(self):
        return self.cmd
    
    def __repr__(self):
        return self.cmd
    
    def __del__(self):
        self.stop = True
        time.sleep(0.1)

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
    
    def list_ports_handler(self, *args, **kwargs):
        """
        Usage: list_ports
        Lists all available serial ports on the system. Each port is assigned a number for reference (see help listen).
        """
        return "Serial Ports:\n" + "\n".join([f"{i} - " + str(port) for i, port in enumerate(serial.tools.list_ports.comports())])
    
    def clear_handler(self, *args, **kwargs):
        """
        Usage: clear
        Clears the console display.
        """
        kwargs['application'].console.clear()
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
        You may also speify a number to listen on a specific port with list_ports.
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
                if args[0].isdigit():
                    ports = serial.tools.list_ports.comports()
                    if int(port) > len(ports):
                        return f"Invalid port number: {port}"
                    port = ports[int(port)].device
                for worker in kwargs['application'].console.workers:
                    if worker.command == "listen" and worker.args[0] == port and worker != self:
                        return f"Already listening on port \"{port}\""
                ser = serial.Serial(port, baudrate=BAUD_RATE, timeout=1)
                self.signals.result.emit(f"Listening on port \"{port}\"")
                data = b''
                while not self.stop:
                    data += ser.read_all()
                    line = None
                    if b'\n' in data:
                        line, _ = data.split(b'\n', 1)
                        data = data[len(line) + 1:]
                    if line:
                        self.signals.result.emit(line.decode('utf-8', errors="replace"))
                ser.close()
        except Exception as e:
            return f"Failed to listen on port \"{port}\"\n" + str(e)
        
    def stop_listen_handler(self, *args, **kwargs):
        """
        Usage: stop_listen [port]
        Stops listening on the specified serial ports. If no port is provided, stops all listeners.
        """
        if len(args) < 1:
            for worker in kwargs['application'].console.workers:
                if worker.command == "listen":
                    worker.stop = True
            return "Stopped all serial listeners"
        for worker in kwargs['application'].console.workers:
            if worker.command == "listen":
                if worker.port in args:
                    worker.stop = True
                    self.signals.result.emit(f"Stopped listening on port \"{worker.port}\"")
    
    def ps_handler(self, *args, **kwargs):
        """
        Usage: ps
        Lists all running commands.
        """
        output = "Running commands:\n"
        for i, worker in enumerate(kwargs['application'].console.workers):
            output += f"{i} - {worker}\n"
        return output

class Console(object):
    def __init__(self, application, display: QPlainTextEdit, input: QLineEdit):
        self.application = application
        self.display = display
        self.input = input
        self.workers = []
        self.threadpool = QtCore.QThreadPool()
        self.input.returnPressed.connect(self.handle_console_command)
        # Recover console history
        if os.path.exists("console_history.txt"):
            with open("console_history.txt", "r") as f:
                console_history = f.read()
                self.display.setPlainText(console_history)
            self.append_output("Console history recovered at " + time.ctime())
            self.display.moveCursor(QtGui.QTextCursor.MoveOperation.End)

    def handle_console_command(self):
        """
        Reads the command from ConsoleInput and processes it.
        Only the 'echo' command is supported for now.
        """
        command_text = self.input.text().strip()
        # Clear the input after reading
        self.input.clear()
        
        if not command_text:
            return

        # Create a worker for the command
        worker = ConsoleCommandHandler(self.application, cmd = command_text)
        self.workers.append(worker)
        worker.signals.result.connect(self.append_output)
        worker.signals.finished.connect(lambda: self.workers.remove(worker))
        worker.signals.error.connect(lambda e: self.append_output("Uncaught exception during execution:\n" + str(e)))
        worker.signals.error.connect(lambda e: logger.error(e))
        self.threadpool.start(worker)

    def append_output(self, text):
        """
        Append text to the ConsoleDisplay widget.
        """
        self.display.appendPlainText(text)

    def clear(self):
        """
        Clears the ConsoleDisplay widget.
        """
        self.display.clear()

    def stop(self):
        """
        Stops all running workers.
        """
        for worker in self.workers:
            worker.stop = True
        return self.threadpool.waitForDone(1000)