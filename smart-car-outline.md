## Chapter Outline: Hybrid Autonomous Navigation System

**Capstone Project: Smart City 2026**

---

### 1. System Overview

* **Description:** A comprehensive overview of the autonomous vehicle subsystem architecture.


* **Key Focus Areas:**
* Introduction to the "Hybrid Navigation" paradigm, which decouples foundational lane-following mechanics from complex, high-level decision-making algorithms.


* The operational role of the autonomous vehicle within the broader Smart City ecosystem, focusing on its interaction with physical infrastructure.


* The software architecture and the utilization of edge computing for localized, real-time data processing.





### 2. Hardware Architecture

* **Description:** Documentation of the physical hardware components and their integration to ensure seamless data transmission from sensors to processing units.


* **Key Focus Areas:**
* **Central Processing Unit:** Deployment of the Raspberry Pi 5 as the primary computational node to execute artificial intelligence models and computer vision pipelines.


* **Vision and Kinematic Sensors:** Integration of the camera subsystem with an MPU-6050 Inertial Measurement Unit (IMU) to capture real-time visual data, yaw rate, and multidimensional acceleration.


* **Actuation Control:** Utilization of an L298N/L293D motor controller to achieve precise manipulation of vehicle velocity and torque via Pulse Width Modulation (PWM) signals.





### 3. Primary Locomotion: Behavioral Cloning for Lane Following

* **Description:** An exposition of the continuous, human-independent lane-following mechanics.


* **Key Focus Areas:**
* **Image Preprocessing:** Isolation of the Region of Interest (ROI) and dimensional scaling to format raw visual input for the neural network.


* **Artificial Intelligence Model:** Application of a Convolutional Neural Network (CNN)—inspired by the PilotNet architecture—optimized in TensorFlow Lite (TFLite) format to guarantee low-latency inference.


* **Steering Control:** Implementation of signal smoothing algorithms to ensure vehicle stability; this subsystem is strictly restricted to basic trajectory maintenance and lane following.





### 4. Intelligent Decision-Making and Maneuvering

* **Description:** A detailed breakdown of the software framework that empowers the vehicle to act as an intelligent agent, dynamically transitioning between distinct driving modes based on environmental stimuli.


* **Key Focus Areas:**
* **Navigation State Machine:** The core state-based architecture governing the transition from nominal lane following to complex maneuvering states (e.g., `APPROACHING_MARKER`, `PRE_TURN_ADVANCE`, and `MANEUVER_TURN`).


* **Vision-Based Spatial Recognition (ArUco Handlers):** Utilizing ArUco markers to establish physical waypoints within the Smart City environment, translating visual cues into deterministic navigational commands.


* **Automated Garage Parking System:** Leveraging delayed-turn states (`ENTRY_DELAYED_RIGHT` and `ENTRY_DELAYED_LEFT`) in conjunction with integrated IMU data to calculate precise rotational angles, ensuring accurate routing and alignment into parking zones.


* **Charging Station Routing:** Employing diagonal entry commands (`ENTRY_DIAGONAL`) to intelligently guide the vehicle into designated charging station trajectories.





### 5. Safety Systems and Event Triggers

* **Description:** The deterministic systems responsible for instantaneous responses to environmental hazards and intersection logic to ensure operational safety.


* **Key Focus Areas:**
* **Obstacle Evasion and Safe Stopping:** Deployment of a high-precision `RedLineDetector` to trigger exact stopping protocols at intersections or physical barriers, coupled with an `EMERGENCY_STOP` fail-safe state.


* **Watchdog Timers:** Implementation of software-level temporal constraints that automatically abort maneuvers and terminate motor power if an operation exceeds a pre-defined duration threshold.





### 6. Telemetry and Synchronized Data Sampling

* **Description:** The data acquisition and visualization framework designed to evaluate vehicle performance and stream real-time metrics.


* **Key Focus Areas:**
* **Synchronized Sampling:** An atomic data-capture mechanism that guarantees camera frames, IMU readings, and motor commands are logged with identical timestamps, effectively eliminating temporal skew.


* **Live Telemetry Heads-Up Display (HUD):** An integrated visual interface overlaying the live video feed to broadcast current speed estimates, active decision-making states, and instantaneous steering values.