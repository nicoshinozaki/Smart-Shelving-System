import lgpio
import time
import threading

gpio_chip = lgpio.gpiochip_open(0)
lgpio.gpio_claim_output(gpio_chip, 17)

def start_read():
	while True:
		print("running read")
		lgpio.gpio_write(gpio_chip, 17, 1)
		time.sleep(0.001)

		lgpio.gpio_write(gpio_chip, 17, 0)
		time.sleep(10)

gpio_thread = threading.Thread(target=start_read, daemon=True)
gpio_thread.start()

while True:
	print("Running real-time calculations...")
	time.sleep(5)

lgpio.gpiochip_close(gpio_chip)
