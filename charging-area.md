# Chapter 7: AI-Driven Autonomous Charging Station System

## 7.1 System Overview

Within the broader "Smart City 2026" ecosystem, energy infrastructure management extends beyond passive distribution to encompass autonomous charging stations that leverage computer vision and artificial intelligence to automate vehicle detection and power allocation. The Autonomous Charging Station System functions as an intelligent Edge Node, explicitly engineered to minimize human intervention in maintenance and energy distribution workflows. This architectural choice enhances operational efficiency and ensures immediate responsiveness to the dynamic needs of electric vehicles.

The system operates as a closed-loop control architecture that integrates real-time visual acquisition, deep inference, and physical electrical actuation. The primary engineering objective is to achieve high reliability in determining the station’s occupancy status (occupied versus available) and to safely activate charging circuits. Crucially, the design addresses inherent environmental challenges—such as fluctuating lighting conditions, transient shadows, and partial occlusions—that often induce instability in traditional detection systems. By synthesizing advanced classification models with temporal hysteresis mechanisms, the system provides a critical layer of safety and stability for the smart city’s energy infrastructure.

## 7.2 Hardware Architecture and Network Topology

The physical infrastructure of the system is designed to operate robustly in harsh environments while maintaining low computational overhead and cost-efficiency. It relies on a distributed Internet of Things (IoT) architecture.

### 7.2.1 Vision Acquisition Unit
The **ESP32-CAM** module serves as the primary unit for visual acquisition and initial stream processing. This component was selected for its integrated combination of a powerful ESP32 microcontroller and the OV2640 camera sensor, providing a compact solution for HTTP-based video streaming.
*   **Stream Configuration:** The module is configured as a local streaming server, providing a continuous video feed accessible via `http://192.168.0.150/stream`. This stream is optimized for compatibility with standard computer vision libraries such as OpenCV, allowing the central processing unit to pull frames with minimal latency.
*   **Physical Control Interface:** Beyond streaming, the unit accepts direct control commands via its embedded web server endpoint (`http://192.168.0.150:81`). These commands manipulate General Purpose Input/Output (GPIO) pins directly connected to electrical actuators.

### 7.2.2 Control Units and Electrical Actuators
The GPIO outputs of the ESP32-CAM interface with two primary execution units that bridge the digital system with the physical world:
1.  **Relay Module:** Acting as a circuit breaker, this module controls the flow of high-voltage electricity to the charging port. Given the high electrical loads associated with vehicle charging, control circuits (3.3V/5V) are electrically isolated from high-power lines using electromechanical or solid-state relays, ensuring the safety of the microcontroller.
2.  **Light Emitting Diode (LED):** This component provides local visual telemetry for station operators or pedestrians, indicating the station’s status (available or occupied) in real-time without requiring interaction with network interfaces.

### 7.2.3 Network Topology and Communication Protocols
The system utilizes a Wireless Local Area Network (Wi-Fi LAN) to facilitate bidirectional communication between the vision node (ESP32-CAM) and the central processing server hosting the AI model.
*   **Data Ingestion Protocol:** The HTTP protocol is employed to continuously pull video frames (MJPEG Stream).
*   **Control Command Protocol:** Targeted HTTP GET requests are used to send toggle commands to the actuators. This lightweight approach ensures ease of integration with Python-based environments via the `requests` library, minimizing protocol overhead.

## 7.3 Software Architecture and Artificial Intelligence Model

Computer vision algorithms constitute the core intelligence of the system. A comprehensive processing pipeline has been developed, extending from frame acquisition to logical decision-making.

### 7.3.1 Classification Model Architecture (YOLOv8)
Rather than employing computationally expensive Object Detection models, the system utilizes an Image Classification model from the **YOLO** family (specifically the `yolo11n-cls.pt` architecture from Ultralytics). This model was selected for its superior inference speed and its ability to distinguish between two primary classes: `Car` (vehicle present) and `No Car` (station vacant).

**Training Phase and Model Calibration:**
The model was trained on a custom dataset comprising thousands of manually annotated frames of charging stations under varying lighting conditions and angles. To ensure model generalization and prevent overfitting, a rigorous training strategy was implemented with the following hyperparameters:
*   **Epochs:** 350 epochs were utilized to ensure convergence toward the minimum loss function.
*   **Batch Size:** A batch size of 32 frames was selected to balance GPU memory utilization with gradient descent stability.
*   **Input Dimensions:** Images were resized to `224x224` pixels, the standard input dimension for lightweight classification networks, reducing computational load without sacrificing critical spatial features.
*   **Data Augmentation:** To harden the model against environmental variations within the charging station, the following techniques were applied:
    *   `flipud=0.5` and `fliplr=0.5`: Vertical and horizontal flips to ensure orientation independence regarding vehicle entry.
    *   `mixup=0.2`: Blending frames with varying transparency levels to simulate partial occlusions, such as pedestrians passing in front of the camera.
    *   `translate=0.1` and `scale=0.5`: Simulating variations in vehicle stopping distances and relative sizes within the frame.
    *   `degrees=10`: Simulating camera vibration or installation angle discrepancies.
    *   `weight_decay=0.0005`: L2 Regularization was applied to constrain network weights and enhance stability.

### 7.3.2 Processing and Inference Pipeline
Inference is executed in real-time using the PyTorch environment, with support for CUDA acceleration when available, and an automatic fallback to the Central Processing Unit (CPU). Each frame undergoes the following sequential steps:
1.  **Acquisition:** Frames are read from the ESP32-CAM stream using `cv2.VideoCapture`.
2.  **Preprocessing:** Frames are resized (`cv2.resize`) to `224x224` pixels to match the input layer dimensions of the neural network.
3.  **Inference:** The processed array is passed through the model (`model.predict`) to generate a probabilities tensor.
4.  **Decision Extraction:** The `torch.argmax` function is employed to identify the index of the highest probability, from which the associated Confidence Score is extracted.

## 7.4 Integrated Control Logic and Stability Mechanisms

The post-inference phase represents the critical distinction between a theoretical academic system and a reliable industrial deployment. In real-world environments, transient shadows, reflections, or partial occlusions can cause the model’s output to fluctuate rapidly between "Car" and "No Car" across consecutive frames. Directly mapping these volatile outputs to the electrical relay would result in "flickering" or rapid cycling of the charging circuits, a phenomenon that is destructive to electrical equipment and poses significant safety risks.

### 7.4.1 Temporal Hysteresis (Cooldown Timer Mechanism)
To mitigate output volatility, a Temporal State Machine was designed, relying on a time-tracking variable (`last_car_time`).
*   **Update Logic:** Whenever the model detects a vehicle (`label.lower() == "car"`), the `last_car_time` timestamp is updated to the current system time.
*   **Stability Condition:** The station’s state is evaluated based on the inequality: `current_time - last_car_time < COOLDOWN_SECONDS`.
*   **Temporal Threshold:** The `COOLDOWN_SECONDS` parameter is set to **5 seconds**. Consequently, the system maintains the "charging active" state for five full seconds after the last visual confirmation of a vehicle. This hysteresis mechanism ensures that temporary losses of visual signal do not trigger immediate power disconnection, thereby protecting the vehicle’s battery and charging circuits from repeated electrical shocks.

### 7.4.2 Actuator Communication Protocol
Based on the state machine’s logic, HTTP commands are issued to the ESP32-CAM. The `send_command` function is designed to be non-blocking and resilient to network errors:
*   **Request Structure:** A GET request is sent to the path `/{device}?state={state}`, where `device` specifies either the `led` or the `relay`.
*   **Error Handling:** A strict timeout of 2 seconds (`timeout=2`) is enforced for network requests. If the ESP32-CAM fails to respond within this window (due to network interruption or reboot), the `RequestException` is caught and logged without disrupting the main inference loop.
*   **Logic Mapping:**
    *   **Vehicle Present (Active State):** The LED is activated (`led` = `on`) for visual indication, and the relay is deactivated (`relay` = `off`). *Note: Relays are typically configured as Active-Low for safety circuits; thus, deactivating the signal closes the circuit, allowing current to flow for charging.*
    *   **Vehicle Absent (Idle State):** The LED is deactivated (`led` = `off`), and the relay is activated (`relay` = `on`) to open the charging circuit and isolate power.

## 7.5 Conclusion and Future Recommendations

The AI-driven Autonomous Charging Station System exemplifies the practical integration of Edge Computing, Computer Vision, and IoT technologies to serve smart city infrastructure. By leveraging the lightweight YOLOv8 architecture, rigorously trained on realistic environmental data, the system achieves high classification accuracy with low latency suitable for real-time requirements. Furthermore, the implementation of the Cooldown Timer mechanism has proven effective in eliminating mechanical and electrical flickering, thereby extending the operational lifespan of the relays and enhancing vehicle safety.