# Chapter 5: Wi-Fi RSSI-Based Indoor Localization System

## 5.1 System Overview

Within the broader architectural framework of the "Smart City 2026" ecosystem, the autonomous vehicle must maintain continuous situational awareness even in GPS-denied environments, such as indoor parking structures, subterranean transit hubs, and dense urban canyons. To address the physical limitations of satellite-based navigation in these contexts, this subsystem implements a robust **Indoor Localization System** predicated on Wi-Fi Received Signal Strength Indicator (RSSI) fingerprinting. This paradigm leverages the unique spatial signatures of ambient radio frequency (RF) propagation to determine the precise physical coordinates of the mobile node.

The system is engineered upon a distributed **Client-Server Topology**. Edge microcontrollers deployed throughout the physical environment act as static reference beacons, while the mobile node mounted on the autonomous vehicle continuously scans the RF spectrum. These edge devices communicate seamlessly with a centralized Python-based processing hub via standard HTTP protocols. This architecture not only decouples the computationally intensive localization algorithms from the resource-constrained microcontrollers but also ensures that the spatial mapping database can be dynamically updated and scaled without requiring firmware modifications to the edge devices. By translating volatile RF signal metrics into deterministic spatial coordinates, this subsystem provides the high-level navigation stack with the critical contextual awareness required for complex urban maneuvering.

## 5.2 Hardware Infrastructure and Network Topology

The physical layer of the localization system relies on a heterogeneous network of embedded microcontrollers, specifically selected for their integrated wireless capabilities, low power consumption, and deterministic real-time performance. The network is strictly partitioned into fixed reference nodes and a mobile scanning node.

### 5.2.1 Fixed Reference Nodes (Beacons)
To establish a reliable spatial anchor grid, four fixed reference nodes are strategically deployed at the perimeters and critical junctures of the environment. Each node is powered by an **ESP32 microcontroller**, explicitly configured to operate in **Access Point (AP) mode** utilizing the `WiFi.softAP()` API. 

Unlike standard station-mode devices that seek out existing networks, these nodes actively broadcast their own localized Wi-Fi networks. Each beacon is provisioned with a unique, hardcoded Service Set Identifier (SSID)—specifically `tower_1`, `tower_2`, `tower_3`, and `tower_4`. This deterministic naming convention is critical for the software pipeline, as it allows the mobile node to instantly filter and isolate the spatial anchors from the chaotic background of ambient commercial Wi-Fi networks. By operating in AP mode, the beacons continuously transmit IEEE 802.11 management frames (beacon frames), ensuring that their RF signatures are perpetually visible to any receiver within their transmission radius.

### 5.2.2 Mobile Scanning Node
The autonomous vehicle is equipped with a mobile scanning node, implemented via an **ESP8266** (or ESP32, depending on the hardware revision), configured strictly in **Station (STA) mode**. The primary directive of this node is environmental sensing rather than network communication. 

Operating within its main execution loop, the mobile node invokes the `WiFi.scanNetworks()` function at regular temporal intervals (configured to a 5-second polling cycle to balance spatial resolution with power efficiency). This command forces the Wi-Fi radio to sweep the local RF spectrum and compile a comprehensive list of all detectable access points. To minimize payload size and computational overhead on the central server, the firmware applies a strict edge-computation filter: it iterates through the scan results and isolates only those SSIDs that match the `tower_*` prefix. The extracted RSSI values (measured in dBm) are then serialized into a lightweight JSON payload and transmitted via an HTTP POST request to the central server's localization endpoint.

## 5.3 Data Acquisition and Fingerprinting Architecture

The efficacy of any RSSI fingerprinting system is fundamentally bound by the quality and density of its empirical baseline dataset. The system employs a rigorous two-phase methodology: an offline calibration phase to construct the radio map, and an online phase for real-time inference.

### 5.3.1 Offline Training Phase (Calibration)
The physical space is discretized into a predefined coordinate grid, with distinct checkpoint locations labeled systematically (e.g., `x1y1`, `x2y2`, `x3y3`, `x4y4`). During the calibration phase, the mobile scanning node is physically placed at each discrete coordinate. 

At each location, the node executes multiple sequential scans to capture the inherent stochasticity of RF propagation, which is subject to multipath fading and transient environmental interference. The resulting RSSI vectors—representing the signal strength from `tower_1` through `tower_4`—are packaged with their corresponding spatial label and transmitted to the server. This repetitive sampling ensures that the resulting fingerprint database captures the statistical variance of the environment, rather than relying on a single, potentially anomalous, signal snapshot.

### 5.3.2 Dataset Management and Ingestion
The centralized server, built upon the **Flask** web framework, manages the ingestion and persistence of the fingerprint data. When the mobile node transmits a calibration payload, it targets the `/train` API endpoint. 

The server's ingestion pipeline performs several critical operations:
1.  **Payload Parsing:** The incoming JSON is parsed to extract the `location` string and the `scan_data` dictionary.
2.  **Noise Filtering:** A secondary software filter is applied to ensure that only telemetry originating from the designated ESP32 beacons (`tower_*`) is committed to the database, effectively rejecting any stray signals from neighboring buildings or personal hotspots.
3.  **Persistence:** The validated data is appended to a central repository named `training_data.csv`. This flat-file database utilizes a strict two-column schema: `location` (the spatial label) and `scan_data` (a JSON-serialized string of the RSSI dictionary). This lightweight storage mechanism allows for rapid read/write operations and seamless integration with Python's data science ecosystem, such as Pandas and SciPy, during the inference phase.

## 5.4 Algorithmic Localization and Spatial Estimation

When the vehicle transitions from the calibration phase to active navigation, the mobile node continuously streams live RSSI scans to the server's `/locate` endpoint. The core computational logic translates these high-dimensional signal metrics into accurate, continuous physical coordinates through a hybrid algorithmic approach combining K-Nearest Neighbors (KNN) classification with Inverse Distance Weighting (IDW).

### 5.4.1 Feature Vector Construction and KNN Classification
Upon receiving a live scan, the server first constructs a unified feature space. Because the mobile node may not always detect all four beacons due to physical obstructions or signal attenuation, the system dynamically identifies all unique Basic Service Set Identifiers (BSSIDs) present in the `training_data.csv`. 

A feature vector is then generated for both the live scan and every historical entry in the database. If a specific beacon is missing from a scan, its RSSI value is deterministically padded with a default penalty value of **-100 dBm**, representing a severe signal attenuation. This ensures that all vectors maintain strict dimensional parity.

To identify the vehicle's probable region, the system computes the **Euclidean distance** between the live feature vector and all historical training vectors using the `scipy.spatial.distance.euclidean` metric. The algorithm then sorts these distances and isolates the **$k=3$ nearest neighbors**. This specific value of $k$ is engineered to balance noise immunity (preventing a single outlier from skewing the result) with spatial precision (ensuring the selected neighbors are genuinely proximate in the RF landscape).

### 5.4.2 Inverse Distance Weighting (IDW) for Continuous Coordinates
Traditional KNN implementations often rely on a majority vote to assign a discrete class label (e.g., outputting `x2y2`). However, for an autonomous vehicle, discrete grid snapping introduces unacceptable jitter and limits spatial resolution. To resolve this, the architecture employs **Inverse Distance Weighting (IDW)** to interpolate continuous $(X, Y)$ coordinates.

Instead of treating the $k=3$ neighbors as equal candidates, the algorithm assigns a mathematical weight to each neighbor based on its proximity to the live scan. The weight is calculated as the inverse of the Euclidean distance, augmented by a microscopic epsilon value ($\epsilon$) to prevent division-by-zero errors in the event of an exact match:
$$ Weight_i = \frac{1}{Distance_i + \epsilon} $$

The final estimated coordinates $(X_{est}, Y_{est})$ are computed as the weighted average of the physical coordinates associated with the $k$ neighbors. This barycentric interpolation allows the system to estimate positions that lie *between* the discrete calibration points. Consequently, if the vehicle is physically located halfway between `x1y1` and `x2y2`, the RSSI signature will reflect a mathematical midpoint, and the IDW algorithm will output a continuous coordinate that accurately reflects this spatial reality, vastly smoothing the vehicle's tracked trajectory.

## 5.5 Telemetry and Real-Time Visualization Interfaces

To facilitate rigorous system validation, debugging, and real-time monitoring, a comprehensive telemetry and visualization layer has been integrated into the localization subsystem. This layer provides both web-based analytical dashboards and high-performance desktop plotting tools.

### 5.5.1 Web-Based Dashboards and Plotly Integration
The Flask server exposes a RESTful endpoint (`/data`) that broadcasts the latest known positions of both the fixed infrastructure and the mobile node. This data is consumed by a responsive web interface (`index.html`) rendered via modern HTML5 and JavaScript.

The frontend leverages the **Plotly.js** library to generate dynamic, interactive scatter plots. The interface polls the server at a 5-second interval, updating the visualization in near real-time. Fixed beacons are rendered as static blue markers with textual labels, while the mobile vehicle is represented by a distinct red marker. This visual feedback loop is indispensable for field engineers, allowing them to instantly verify the spatial distribution of the beacons and observe the fluidity of the mobile node's interpolated path. Additionally, a secondary discrete visualization (`map.html`) utilizes a CSS Grid layout (7x7 cells) to map the vehicle's location to specific physical zones, providing a simplified, high-level overview of the vehicle's sector.

### 5.5.2 Dynamic Desktop Plotting and Asynchronous Threading
For deep-dive analysis and high-frequency trajectory tracking, the system incorporates a desktop-based visualization engine utilizing **Matplotlib**. The `FuncAnimation` class is deployed to generate continuous, asynchronous animations of the vehicle's spatial trajectory.

Architecturally, this requires the concurrent execution of the Flask web server and the Matplotlib event loop. This is achieved through Python's `threading` module. The Flask application is instantiated and executed within a daemon thread, ensuring it listens for incoming HTTP POST requests from the ESP microcontrollers without blocking the main thread. The main thread is exclusively dedicated to the Matplotlib rendering loop. Upon receiving and processing a new localization estimate via the KNN/IDW pipeline, the global coordinate variables are updated, and the Matplotlib canvas is redrawn. This decoupled, multi-threaded architecture guarantees that the high-frequency data ingestion from the physical hardware never compromises the smooth, real-time rendering of the analytical plots.

## 5.6 Conclusion

The Wi-Fi RSSI-Based Indoor Localization System represents a highly pragmatic, cost-effective, and computationally efficient solution for navigating GPS-denied environments within the Smart City ecosystem. By strategically deploying ESP32 access points as static spatial anchors and utilizing an ESP8266/ESP32 mobile node for active RF spectrum analysis, the system captures the unique electromagnetic fingerprint of the physical space. The integration of a centralized Flask processing hub, combined with a hybrid KNN and Inverse Distance Weighting algorithmic pipeline, elevates the system from simple discrete zone detection to continuous, high-resolution spatial tracking. Coupled with robust, multi-tiered visualization interfaces, this subsystem provides the autonomous vehicle with the precise, real-time situational awareness required to execute complex navigation protocols in indoor and subterranean environments.