from Workers import WorkerSignals, WorkerThread
import serial
import time
import numpy as np
from PyQt6.QtCore import QTimer, QEventLoop
from copy import deepcopy
import re
from enum import Enum
from dataclasses import dataclass
import os
import json

FORMAT = r'^[^,]+,[12345678]+,<[0-9a-fA-F]{4}>$' # re for parsing

class FilterMethod(Enum):
    NoFiltering = 0
    WindowLPF = 1
    HMMViterbi = 2

    def __str__(self):
        return self.name

    @classmethod
    def from_string(cls, method_str):
        try:
            return cls[method_str]
        except KeyError:
            raise ValueError(f"Invalid filter method: {method_str}")

@dataclass
class method_states_t:
    filter_method: FilterMethod
    previous_method: FilterMethod
    next_method: FilterMethod

    def __init__(self, method: FilterMethod = FilterMethod.NoFiltering):
        # This setup allows a lock free synchronization
        self.filter_method = method
        self.previous_method = method
        self.next_method = method


method_state = method_states_t()

class TagTracker(object):
    def __init__(self, window_size = 3):
        # No existance on initialization
        self.detections = np.zeros(window_size)
        self.previous_state = False
        self.state = False

        self.viterbi_states = {
            "A": np.array([
                [0.95, 0.05],  # from Present
                [0.05, 0.95]   # from Absent
            ]),
            "B": np.array([
                [0.1, 0.9],  # Present
                [0.8, 0.2]   # Absent
            ]),
            "V_prev": np.array([0.05, 0.95])  # [Present, Absent]
        }

    def __str__(self):
        return f"TagTracker(state={self.state}, detections={self.detections})"

    def update(self, detection: bool):
        global method_state
        self.detections = np.roll(self.detections, -1)
        self.detections[-1] = 1 if detection else 0
        self.previous_state = self.state

        if method_state.filter_method == FilterMethod.NoFiltering:
            # No filtering, just update the state
            self.state = self.detections[-1].astype(bool)

        elif method_state.filter_method == FilterMethod.WindowLPF:
            self.state = np.mean(self.detections) > 0.5

        elif method_state.filter_method == FilterMethod.HMMViterbi:
            if method_state.previous_method != method_state.filter_method:
                # Reset the Viterbi states when the method changes
                self.viterbi_states["V_prev"] = np.array([0.95, 0.05]) if self.state else np.array([0.05, 0.95])
            obs_index = int(detection)  # 1 if True, 0 if False
            # Compute max over previous states for each current state
            self.viterbi_states["V_prev"] = np.max(self.viterbi_states["V_prev"][:, None] *
                self.viterbi_states["A"] *
                self.viterbi_states["B"][:, obs_index],
                axis=0)
            self.state = True if np.argmax(self.viterbi_states["V_prev"]) == 0 else False
        
        return self.state, self.previous_state
        
    def getState(self):
        return self.state


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
        self.trackers = {}
        for i in range(self.antenna_count):
            self.trackers[i] = {}
        self.tag_counts = {i: 0 for i in range(self.antenna_count)}
        self.scan_time = scan_time
        self.window_size = window_size
        self.pause_flag = False
        
        super().__init__(self._run)

    def change_filter_method(self, method: FilterMethod):
        global method_state
        method_state.next_method = method

    def pause(self):
        self.pause_flag = True
        
    def start(self):
        self.pause_flag = False

    def _run(self):
        while not self.stop_flag:
            if self.pause_flag:
                time.sleep(0.5)
            else:
                self._scan()

    def _scan(self):
        global method_state
        method_state.previous_method = method_state.filter_method
        method_state.filter_method = method_state.next_method

        # Fetch the buffer from the device
        buffer = self._fetch_buffer(self.device)
        # Parse the buffer
        tags = self._parse_buffer(buffer)

        changed_antennas = set()
        self.tag_counts = {i: 0 for i in range(self.antenna_count)}
        for antenna_num, tag in tags:
            # check if a tracker exists for this tag
            if tag not in self.trackers[antenna_num]:
                self.trackers[antenna_num][tag] = TagTracker(self.window_size)
            # update the tracker
            state, previous = self.trackers[antenna_num][tag].update(True)

            if state:
                self.tag_counts[antenna_num] += 1
            if state != previous:
                changed_antennas.add(antenna_num)
        # emit only changed antennas
        if changed_antennas:
            self.pause()
            self.signals.result.emit({i: self.tag_counts[i] for i in changed_antennas})

    @staticmethod
    def _parse_buffer(buffer):
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
