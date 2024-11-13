#!/usr/bin/python3
import serial
import time
import sys

def print_bytes(b):
    i = 0
    for byte in b:
        i += 1
        print(f"{byte:02x}", end=' ')
        if i % 8 == 0: print()
    print()

def print_bytes_split(b, delimiter):
    split_array = b.split(delimiter)
    for line in split_array:
        for byte in line:
            print(f"{byte:02x}", end=' ')
        print()
    print()

READ = [0x7C,0xFF,0xFF,0x20,0x00,0x00,0x66]

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Missing argument <device>")
        exit(0)
    # Open the serial port
    ser = serial.Serial(
        port="/dev/" + sys.argv[1],
        baudrate=57600,
        bytesize=serial.EIGHTBITS,      # Set data bits to 8
        parity=serial.PARITY_NONE,      # No parity
        stopbits=serial.STOPBITS_ONE,   # One stop bit
        timeout=5
    )

    # Check if the port is open
    if ser.is_open:
        print("Serial port is open")
    else:
        print('Error opening serial port')
        exit(-1)

    print("Tx")
    print_bytes(READ)
    ser.write(bytes(READ))

    time.sleep(0.5)

    data = ser.read_all()
    print("Rx")
    header = b"\xcc\xff\xff"
    print_bytes_split(data, header)
    print(f"{data.count(header)-1} unique tags detected")
    # Close the serial port
    ser.close()
