## Chapter Outline: AI-Driven Autonomous Charging Station System

**Capstone Project: Smart City 2026**

---

### 1. System Overview

* **Description:** An introduction to the intelligent charging station subsystem, which leverages artificial intelligence to automate vehicle detection and secure energy distribution protocols.


* **Key Focus Areas:**
* **System Objectives:** Automating the charging process through intelligent vehicle recognition and autonomous power management.


* **Role in Smart City Infrastructure:** Enhancing energy efficiency and operational autonomy by minimizing human intervention in vehicle maintenance and charging workflows.





### 2. Hardware Architecture

* **Description:** Documentation of the physical hardware ecosystem designed to support computer vision processing and power actuation.


* **Key Focus Areas:**
* **Vision Acquisition:** Utilization of the ESP32-CAM module to provide real-time video streaming of the charging zone.


* **Control Units and Actuators:** Integration of embedded controllers to manage visual feedback via LEDs and electrical power distribution via relay modules.


* **Connectivity:** Implementation of a Local Area Network (Wi-Fi) to facilitate data transmission between the vision subsystem and the central processing unit.





### 3. Software Architecture and Artificial Intelligence Model

* **Description:** An exposition of the software models and logic utilized for image classification and intelligent decision-making.


* **Key Focus Areas:**
* **YOLOv8 Classification:** Deployment of the YOLO (You Only Look Once) classification model, trained to distinguish between occupied ("Car") and vacant ("No Car") charging zones.


* **Processing Pipeline:** Real-time stream processing, including frame resizing to meet model input specifications, followed by inference generation and confidence scoring.





### 4. Integrated Control Logic

* **Description:** An explanation of the integration layer connecting AI inference results with physical hardware actuation.


* **Key Focus Areas:**
* **Control Logic Implementation:** Utilization of a cooldown timer mechanism to ensure signal stability, thereby preventing erratic state switching (flickering) in scenarios of intermittent vehicle detection.


* **Actuator Communication:** Issuance of HTTP-based commands to toggle LED status and relay power states based on the final classification output of the model.