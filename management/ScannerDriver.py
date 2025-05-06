from Workers import WorkerSignals, WorkerThread
import serial
import time
import numpy as np
from PyQt6.QtCore import QTimer, QEventLoop
from copy import deepcopy
import re

FORMAT = r'^[^,]+,[12345678]+,<[0-9a-fA-F]{4}>$' # re for parsing

class ScannerDriver(WorkerThread):
    def __init__(self, application, device = None, antenna_count = 4,
                 scan_time = 3, window_size = 3):
        # Default 3 scans, 3 secods each

        self.application = application      # main application object
        self.device = device                # serial device
        self.antenna_count = antenna_count

        # state variable is a dictionary of dictionaries
        # Each key is the antenna number
        # Each value is a dictionary of tags
            # Each key is the tag ID
            # Each value is an np.array of presence boolean
        self.state = {}
        for i in range(self.antenna_count):
            self.state[i] = {}
        self.scan_time = scan_time
        self.window_size = window_size
        self.pause_flag = False
        
        super().__init__(self._run)

    def pause(self):
        self.pause_flag = True
        
    def start(self):
        self.pause_flag = False

    def _run(self):
        while not self.stop_flag:
            if self.pause_flag:
                time.sleep(0.2)
            else:
                self._scan()

    def _scan(self):
        self._clear_state()
        for i in range(self.window_size):
            self.application.update_status(f"Scanning... {i+1}/{self.window_size}")
            buffer = self._fetch_buffer(self.device)
            #self.application.console.append_output(buffer)
            data = self._parse_buffer(buffer)
            #self.application.console.append_output(str(data))
            self._update_state(i, data)

        for antenna_num in range(self.antenna_count):
            for tag in self.state[antenna_num]:
                self.state[antenna_num][tag] = np.mean(self.state[antenna_num][tag])
        # have main application update the GUI
        # the result signal should be connected to a slot
        # that  1) finds the diff
        #       2) asks the user if this is accurate
        #       3) updates the GUI
        if not self.stop_flag: self.signals.result.emit(deepcopy(self.state))
        self.application.update_status("Ready")

    def _update_state(self, scan_count, data):
        # data is a set of tuples (antenna_num, tag)
        for antenna_num, tag in data:
            if tag in self.state[antenna_num]:
                self.state[antenna_num][tag][scan_count] = 1
            else:
                self.state[antenna_num][tag] = np.zeros(self.window_size)
                self.state[antenna_num][tag][scan_count] = 1

    def _clear_state(self):
        for i in range(self.antenna_count):
            self.state[i] = {}

    def _parse_buffer(self, buffer):
        # this returns a set of tuples (antenna_num, tag) for
        # each tag in the buffer
        result = set()
        lines = buffer.split("\n")
        for line in lines:
            line = line.strip()
            if bool(re.fullmatch(FORMAT, line)):
                id, antenna, _ = line.split(",")
                result.add((int(antenna), id))
        return result
    
    def _fetch_buffer(self, device):
        data = b''
        start_time = time.time()
        with serial.Serial(device, baudrate=115200, timeout=1) as ser:
            while time.time() - start_time < self.scan_time and not self.stop_flag:
                data += ser.read_all()

        return data.decode('utf-8', errors='replace')
