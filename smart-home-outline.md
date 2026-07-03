## Chapter Outline: Smart Home Subsystem Architecture

**Project: Smart City 2026**

---

### 1. Introduction

* **1.1 Subsystem Overview:** Introduction to the Smart Home subsystem as a core, localized intelligent environment within the broader Smart City 2026 infrastructure.
* **1.2 System Objectives:** Automating environmental controls, ensuring life safety through localized hazard detection, and establishing a hands-free, AI-driven human-computer interaction layer via voice and biometric recognition.

### 2. Hardware Infrastructure and Sensor Integration

* **2.1 Central Microcontroller Unit**
* Description of the Arduino Mega as the primary edge controller.
* Implementation of a non-blocking, asynchronous state machine to handle real-time sensor polling and actuator control without execution delays.


* **2.2 Environmental & Safety Sensors**
* **Climate Monitoring:** Integration of the DHT11 sensor (Pin 22) for continuous temperature and humidity telemetry.
* **Hazard Detection:** Implementation of an active-low Flame Sensor (Pin 24) and Digital Gas Sensor (Pin 26) for immediate fire and gas leak identification.


* **2.3 Automation & Lighting Control**
* **Presence Detection:** Integration of three independent PIR motion sensors monitoring specific zones (Room A: Pin 33, Room B: Pin 34, Room C: Pin 35).
* **Illumination Actuation:** Relay modules controlling lighting states (Pins 30, 31, 32) driven by automated PIR triggers or manual overrides.


* **2.4 Physical Actuators and Alerts**
* **Ventilation:** Automated fan relay (Pin 6) and motorized window servo (Pin 5) for environmental regulation and emergency gas clearing.
* **Audible Alarm:** Dedicated buzzer (Pin 7) for localized hazard alerts.


* **2.5 Local Display Interface**
* Integration of an ST7735 TFT SPI Display.
* Rendering logic for real-time telemetry, room-by-room status grids, and priority-based emergency toast notifications.



### 3. Artificial Intelligence and Software Architecture

* **3.1 Voice Assistant Pipeline**
* **Wake-Word Detection:** Zero-network localized listening using the `OpenWakeWord` engine to process PCM audio streams and trigger system wake.
* **Speech-to-Text (STT):** Utilization of the `Faster-Whisper` model to transcribe captured microphone audio into text arrays.
* **Natural Language Processing (NLP):** Deployment of a local `Ollama` instance (running Mistral-7B) to parse transcribed intents and generate conversational responses based on strict environmental context prompts.
* **Text-to-Speech (TTS):** Real-time, streaming audio synthesis of the assistant's replies using `FastSpeech2` (Conformer with HiFi-GAN) or `Coqui XTTS v2` architectures.


* **3.2 Biometric Security (Face Recognition)**
* **Visual Input:** Processing MJPEG video streams from an ESP32-CAM or localized USB webcam.
* **Face Mapping:** Utilizing `MediaPipe FaceLandmarker` for spatial feature extraction and embedding generation.
* **Identity Verification:** Classification of known users using a `Scikit-Learn NearestNeighbors` model calculating cosine similarity distances against enrolled profiles.
* **Liveness Checking:** Application of Laplacian variance algorithms to calculate image blurriness, distinguishing real faces from 2D spoofing attempts.


* **3.3 Interactive User Interface (UI)**
* Architecture of the browser-based client hosted via a Python HTTP server and synchronized via WebSockets (`ui/server.py`).
* Visual representation of the assistant's internal state machine (Dormant, Listening, Thinking, Speaking) using a dynamic, audio-reactive "Liquid Blob" rendered via HTML5 Canvas and Fast Fourier Transform (FFT) audio analysis.



### 4. System Integration and Data Flow

* **4.1 Command Routing and Execution**
* Detailed mapping of the NLP module's parsed intents to specific HTTP API endpoints defined in the centralized configuration (`config.json`).
* Execution flow of RESTful POST commands dispatched to the Arduino hub to toggle relays and servos.


* **4.2 Security Protocol Execution**
* The conditional data flow when physical access (e.g., "open the door") is requested by the user.
* The temporary suspension of the Voice Assistant to trigger the Face Recognition Flask API, followed by access authorization upon successful identity and liveness verification.


* **4.3 Emergency Override System**
* The hardware-level interrupt hierarchy: how the detection of fire or gas bypasses standard operational logic.
* The automated emergency response sequence: sounding the buzzer, disabling lighting relays, activating ventilation fans, and locking the TFT display into a visual alert state.



### 5. Conclusion

* Summary of the subsystem's effectiveness in merging edge-based AI with responsive hardware.
* Final thoughts on the reliability, privacy (local processing), and modularity of the smart home architecture within the Smart City 2026 framework.
