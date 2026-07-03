## Chapter Outline: Wi-Fi RSSI-Based Indoor Localization System

**Capstone Project: Smart City 2026**

---

### 1. System Overview

* **Description:** A high-level introduction to the indoor positioning architecture, specifically engineered for navigation in GPS-denied environments.


* **Key Focus Areas:**
* **RSSI Fingerprinting Paradigm:** The utilization of Received Signal Strength Indicator (RSSI) metrics derived from local Wi-Fi networks to construct spatial signatures and determine precise coordinates.


* **Client-Server Topology:** The implementation of a distributed network model where edge microcontrollers communicate seamlessly with a centralized Python processing hub via standard HTTP protocols.





### 2. Hardware Infrastructure and Network Topology

* **Description:** Documentation of the embedded hardware ecosystem deployed for both signal broadcasting and environmental data acquisition.


* **Key Focus Areas:**
* **Fixed Reference Nodes (Beacons):** The strategic deployment of ESP32 microcontrollers configured in Access Point (AP) mode. These nodes broadcast designated SSIDs (e.g., "tower_1" through "tower_4") to serve as static spatial anchors within the environment.


* **Mobile Scanning Node:** The integration of a mobile ESP32 module operating in station mode. This node is programmed to actively scan the local radio frequency spectrum, isolate targeted beacon networks, extract real-time RSSI values, and transmit packaged JSON payloads to the central server.





### 3. Data Acquisition and Fingerprinting Architecture

* **Description:** The methodical approach to establishing the empirical baseline dataset required for robust algorithmic localization.


* **Key Focus Areas:**
* **Offline Training Phase (Calibration):** The systematic mapping of the physical space through the collection of RSSI vectors at discrete, predefined grid locations (e.g., 'x1y1', 'x2y2').


* **Dataset Management:** The aggregation of coordinate labels and their corresponding RSSI scan arrays into a central repository (`training_data.csv`). This data ingestion is handled by a dedicated Flask API endpoint (`/train`).





### 4. Algorithmic Localization and Spatial Estimation

* **Description:** The core computational logic responsible for translating real-time signal metrics into accurate, continuous physical coordinates.


* **Key Focus Areas:**
* **K-Nearest Neighbors (KNN) Classification:** The application of the Euclidean distance metric across high-dimensional RSSI feature vectors. This algorithm identifies the three closest historical matches (k=3) from the fingerprint database to determine the most probable spatial region.


* **Weighted Interpolation:** The enhancement of discrete classification through Inverse Distance Weighting algorithms. This mathematical refinement allows the system to interpolate dynamic, continuous coordinates between the established training points, significantly improving spatial resolution.





### 5. Telemetry and Real-Time Visualization Interfaces

* **Description:** The integration of graphical analytics tools designed to monitor the mobile node's trajectory and evaluate the efficacy of the localization model.


* **Key Focus Areas:**
* **Web-Based Dashboards:** The development of responsive web interfaces served via Flask. These include dynamic HTML/JavaScript grid layouts and Plotly-driven scatter plots that render the relative positions of both fixed towers and the mobile vehicle.


* **Dynamic Desktop Plotting:** The employment of Matplotlib to generate continuous, asynchronous animations. This provides an active, real-time spatial trajectory tracking mechanism based on the live coordinate estimations.