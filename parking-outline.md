## Chapter Outline: Computer Vision-Based Smart Parking System

**Capstone Project: Smart City 2026**

---

### 1. System Overview

* **Description:** An architectural overview of the smart parking system designed to analyze and manage parking slot occupancy in real time using computer vision and artificial intelligence techniques.


* **Key Focus Areas:**
* **Decoupled Architecture:** Autonomous monitoring and occupancy tracking using visual feeds, removing the need for physical, slot-embedded hardware sensors.


* **Stream Ingestion:** Real-time video processing as the foundational input for spatial coordinate mapping and continuous occupancy state evaluation.





### 2. Data Acquisition Infrastructure

* **Description:** Documentation of the programmatic modules and infrastructure responsible for capturing, scaling, and parsing video stream data.


* **Key Focus Areas:**
* **Vision Ingestion Subsystem:** Deployment of network-connected surveillance modules (such as an ESP32-CAM via HTTP video streaming) to feed real-time imagery of the parking space.


* **Image Preprocessing Module (OpenCV):** Stream parsing and resolution scaling implementation within the codebase to adjust and format frames for downstream computer vision pipelines.





### 3. Deep Learning Subsystem for Vehicle Detection

* **Description:** An analysis of the deep learning frameworks and embedded models utilized to detect and localize vehicles within active video frames.


* **Key Focus Areas:**
* **Embedded Inference Framework (MediaPipe & TensorFlow Lite):** Orchestration of lightweight object detection utilizing specialized models (e.g., `efficientdet_lite0.tflite` and `ssd_mobilenet_v2.tflite`) optimized for fast execution.


* **Frame Transformation Pipeline:** Preprocessing of video frames via BGR-to-RGB color space conversions prior to inference mapping for bounding box coordinate extraction.


* **Confidence Scoring Filter:** Application of adjustable confidence thresholds to prune weak object detections and guarantee true-positive vehicle classification.





### 4. Geometric Spatial Management Algorithms

* **Description:** A detailed breakdown of the geometric calculations and logic used to map localized vehicle bounding boxes to discrete parking slot regions.


* **Key Focus Areas:**
* **Interactive Slot Configuration:** Delineation of custom parking geometries as polygonal coordinates using a dedicated visualization script (`Drawer.py`) archived into a configuration file (`slots.json`).


* **Occupancy Checking via Centroid Analysis:** Calculation of the exact geometric center of a detected vehicle bounding box to evaluate occupancy.


* **Point-in-Polygon (PIP) Implementation:** Execution of a programmatic ray-casting algorithm to determine if a vehicle's centroid resides within the boundaries of a defined slot polygon.


* **Dynamic Coordinate Translation:** Automated computation of horizontal and vertical scaling factors to dynamically align saved slot polygons with changes in runtime stream dimensions.





### 5. Telemetry Rendering and System Integration

* **Description:** Integration of the analytical outputs to render real-time telemetry overlays and provide an intuitive monitoring interface.


* **Key Focus Areas:**
* **Vehicle Annotation Layer:** Real-time rendering of protective bounding boxes accompanied by class categories and prediction confidence metrics.


* **Dynamic Slot Color-Coding:** Real-time vector rendering of parking polygons, which dynamically shift to green for vacant status or red for occupied status based on spatial logic outputs.


* **Unified Real-Time Window:** Compilation of all annotation layers into a singular, continuous video feedback matrix displayed to the user via a live window.