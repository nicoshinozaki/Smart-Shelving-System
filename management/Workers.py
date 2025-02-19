from PyQt6 import QtCore
import traceback

class WorkerSignals(QtCore.QObject):
    finished = QtCore.pyqtSignal()
    error = QtCore.pyqtSignal(tuple)
    result = QtCore.pyqtSignal(object)

class WorkerThread(QtCore.QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super().__init__()
        self.stop_flag = False
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

    def stop(self):
        self.stop_flag = True