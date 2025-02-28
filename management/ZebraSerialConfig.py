import serial
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoAlertPresentException
import subprocess

class ZebraSerialConfig:
    def __init__(self, driver_path, url, password):
        self.driver_path = driver_path
        self.url = url
        self.password = password
        self.service = Service(self.driver_path)
        self.driver = webdriver.Chrome(service=self.service)

    def frame_switch(self, frame_id):
        WebDriverWait(self.driver, 10).until(EC.frame_to_be_available_and_switch_to_it((By.ID, frame_id)))

    def wait_for_element(self, type, element):
        if type == "ID":
            return WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.ID, element)))
        elif type == "XPATH":
            return WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.XPATH, element)))

    def alert_check(self):
        try:
            WebDriverWait(self.driver, 10).until(EC.alert_is_present())
            alert = self.driver.switch_to.alert
            print(f"Alert detected: {alert.text}")
            alert.accept() 
        except NoAlertPresentException:
            print("No alert detected.")

    def connect(self):
        try:
            # Load Zebra Website (Configured IP Address)
            self.driver.get(self.url)
            print(self.driver)
            
            # Switch to Login Frame
            self.frame_switch(self.driver, "Login")
            
            # Enter Password
            password_field = self.wait_for_element(self.driver, "ID", "password")
            password_field.send_keys("SmartShelving1!")

            # Click Login Button
            login_button = self.driver.find_element(By.ID, "LoginId-button")
            ActionChains(self.driver).move_to_element(login_button).click().perform()

            # Check for Active Session
            self.alert_check(self.driver)

            # Switch to menuId Frame
            time.sleep(5)
            print(self.driver.page_source)  # Check if elements exist in the source
            self.frame_switch(self.driver, "menuId")

            # Load up Serial Port Configuration and Connect
            communication_button = self.wait_for_element(self.driver, "XPATH", "//*[@id='v_mnu_01']/ul/li[6]/a")
            communication_button.click()

            serial_port_config_button = self.wait_for_element(self.driver, "ID", "SerialPortConfigLink")
            serial_port_config_button.click()
            
            time.sleep(5)

            # Switch to Content Frame
            self.driver.switch_to.parent_frame()
            self.frame_switch(self.driver, "content")

            # Wait for 'Connect' Button and Configure Serial Port
            connect_button = self.wait_for_element(self.driver, "ID", "btnLLRPConnect")
            button_text = connect_button.text.strip()
        
            if button_text == "Connect":
                print("Button is in now in 'Connect' state.")
                ActionChains(self.driver).move_to_element(connect_button).click().perform()

                # Wait until the text changes to "Disconnect"
                WebDriverWait(self.driver, 10).until(
                    lambda d: d.find_element(By.ID, "btnLLRPConnect").text.strip() == "Disconnect"
                )
            time.sleep(20)

        except serial.SerialException as e:
            print(f"Error with Zebra Interface: {e}")
        except KeyboardInterrupt:
            print("\nExiting program.")


if __name__ == "__main__":
    chromedriver_path = subprocess.check_output(["which", "chromedriver"]).decode().strip()
    url = "http://169.254.250.233/"
    password = "SmartShelving1!"
    
    zebra_interface = ZebraSerialConfig(chromedriver_path, url, password)
    zebra_interface.connect()