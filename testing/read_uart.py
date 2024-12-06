import serial
import time

def main():
    # Configure the serial connection
    uart_device = '/dev/tty.usbserial-A9Z2MKOX'  # Replace with your device file
    baud_rate = 115200  # Update as per Zebra FX9600 specifications
    received_data_set = set()
    antenna_count = {1: 0, 2: 0} # Count number of tags seen by each antenna

    try:
        # Open the UART connection
        with serial.Serial(uart_device, baudrate=baud_rate, timeout=1) as ser:
            print(f"Connected to {uart_device} at {baud_rate} baud.")
            print("Waiting for data...")

            start_time = time.time()

            while True:
                elapsed_time = time.time() - start_time
                if elapsed_time > 10:
                    break

                # Read a line of data
                data = ser.readline().decode('utf-8').strip()

                # Print the received data
                if data:
                    # Remove "Received: " prefix
                    if data.startswith("Received: "):
                        data = data[len("Received: "):]

                    # Ignore invalid tags
                    if not data.startswith("E"):
                        continue

                    if data.startswith("E28069950000"):
                        data = data[len("E28069950000x005D36"):]

                    # Check for duplicates
                    if data not in received_data_set:
                        received_data_set.add(data)

                        parts = data.split(",")
                        if len(parts) >= 2:
                            antenna_id = parts[1]
                            if antenna_id == "1":
                                antenna_count[1] += 1
                            elif antenna_id == "2":
                                antenna_count[2] += 1

                        print(data)  # Output unique, cleaned data

    except serial.SerialException as e:
        print(f"Error: {e}")
    except KeyboardInterrupt:
        print("\nExiting program.")

    print("\nReading complete.")
    print(f"Tags read by antenna 1: {antenna_count[1]}")
    print(f"Tags read by antenna 2: {antenna_count[2]}")


if __name__ == "__main__":
    main()