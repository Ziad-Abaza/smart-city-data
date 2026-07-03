# Chapter 4: Smart Home Subsystem Architecture

## 1. Introduction

### 1.1 Subsystem Overview
The Smart Home subsystem functions as a localized, intelligent environment within the broader Smart City 2026 infrastructure. It is designed not merely as a collection of automated devices, but as a cohesive cyber-physical system that integrates edge computing, artificial intelligence, and real-time hardware control. By operating independently of continuous cloud connectivity, this subsystem ensures low-latency responses for critical safety operations while maintaining seamless integration with the wider smart city ecosystem through standardized API protocols. The architecture prioritizes data privacy by processing sensitive biometric and voice data locally, establishing a secure and responsive foundation for modern residential automation.

### 1.2 System Objectives
The primary engineering objectives of this subsystem are threefold:
*   **Environmental Automation and Efficiency:** To automate climate control, lighting, and ventilation systems using non-blocking, asynchronous logic that responds dynamically to sensor telemetry without introducing execution delays.
*   **Life Safety and Hazard Mitigation:** To implement a robust, hardware-level interrupt hierarchy for immediate detection of fire and gas leaks, ensuring that emergency protocols override all standard operational states to protect occupants.
*   **Natural Human-Computer Interaction (HCI):** To establish a hands-free interaction layer powered by local AI models. This includes wake-word detection, speech-to-text transcription, natural language understanding, and biometric face recognition, all processed on-device to guarantee privacy and reliability.

---

## 2. Hardware Infrastructure and Sensor Integration

### 2.1 Central Microcontroller Unit
The Arduino Mega serves as the primary edge controller for the physical layer of the smart home. Its selection was driven by the need for multiple digital I/O pins and sufficient memory to handle concurrent sensor polling and actuator control. A critical architectural decision was the implementation of a **non-blocking, asynchronous state machine** within the firmware. Unlike traditional blocking code that uses `delay()` functions, this system utilizes `millis()` to track elapsed time for each task. This allows the microcontroller to perform high-frequency safety checks (50 Hz), moderate-frequency environmental readings (2.5 s), and periodic motion detection (1 s) simultaneously. This cooperative scheduling model ensures that no single task stalls the execution loop, providing real-time responsiveness essential for safety-critical applications.

### 2.2 Environmental & Safety Sensors

#### Climate Monitoring
Temperature and humidity telemetry are acquired via a **DHT11 sensor** connected to digital pin 22. Given the sensor’s relatively slow response time and strict timing requirements, its readings are isolated in a dedicated task that executes every 2.5 seconds (`dhtReadInterval`). The resulting temperature and humidity values are cached in global variables (`currentTemperature`, `currentHumidity`), allowing other system components—such as the UI display and voice assistant—to access fresh data without triggering redundant hardware reads, thereby optimizing bus usage and processor load.

#### Hazard Detection
Safety monitoring employs an active-low **Flame Sensor** on pin 24 and a digital **Gas Sensor** on pin 26. These sensors are integrated into the highest-priority task, `runSafetyCheck`, which executes every 20 milliseconds. The system interprets a LOW signal from these sensors as an immediate hazard. Upon detection, the state machine triggers a preemptive transition to an emergency state (`STATE_EMERGENCY_FIRE` or `STATE_EMERGENCY_GAS`), bypassing all normal operational logic. This hardware-centric approach ensures that hazard detection remains functional even if higher-level software processes encounter errors.

### 2.3 Automation & Lighting Control

#### Presence Detection
Occupancy is monitored using three independent **PIR (Passive Infrared) motion sensors** assigned to specific zones: Room A (pin 33), Room B (pin 34), and Room C (pin 35). These sensors feed into a periodic evaluation task (`runPirCheck`) that runs every second. The logic supports both automatic activation upon motion detection and manual override via voice commands. The system maintains boolean state variables (`lightStateA`, `lightStateB`, `lightStateC`) that serve as the single source of truth for lighting status, ensuring consistency between physical relay states and logical system status.

#### Illumination Actuation
Lighting control is achieved through relay modules connected to pins 30, 31, and 32. The firmware decouples logical state management from physical actuation. When a change in lighting status is requested—whether by motion detection or voice command—the corresponding boolean variable is updated immediately. The physical relays are then synchronized with these variables in the subsequent cycle of the main loop. This separation prevents race conditions and ensures that rapid successive commands do not cause electrical jitter or conflicting signals on the output pins.

### 2.4 Physical Actuators and Alerts

#### Ventilation and Emergency Response
Environmental regulation is managed by a fan relay on pin 6 and a motorized window servo on pin 5. While these actuators can be controlled manually or based on temperature thresholds, their most critical function is in emergency scenarios. In the event of a gas leak, the system automatically activates the fan and opens the window to maximum capacity to dissipate hazardous gases. This action is hard-coded into the emergency state handler, ensuring it executes regardless of prior user settings.

#### Audible Alarm
A dedicated buzzer on pin 7 provides audible feedback for both routine interactions and emergency alerts. During normal operation, it emits short confirmation tones. In emergency states, it switches to a high-frequency, intermittent alarm pattern. The buzzer control is also implemented using a non-blocking state machine, allowing it to pulse without halting other critical processes such as sensor reading or serial communication.

### 2.5 Local Display Interface
A **ST7735 TFT SPI Display** provides local visual feedback, displaying real-time telemetry, room statuses, and emergency alerts. The rendering logic is optimized to minimize flicker and reduce SPI bus traffic. The display operates in a layered manner:
*   **Static Layers:** Grid lines and labels are drawn only when necessary (e.g., during initialization or state changes).
*   **Dynamic Layers:** Telemetry values (temperature, humidity) and room statuses are updated incrementally, redrawing only the changed characters.
*   **Emergency Overlay:** In hazard scenarios, the entire screen is cleared and replaced with high-contrast warning messages (red for fire, yellow for gas), ensuring immediate visual recognition of critical events.

---

## 3. Artificial Intelligence and Software Architecture

### 3.1 Voice Assistant Pipeline
The voice assistant operates as a multi-stage processing pipeline, designed to minimize latency while maximizing accuracy through local inference.

#### Wake-Word Detection
The system employs **OpenWakeWord**, a lightweight neural network engine, to continuously monitor audio input for specific wake phrases (e.g., "Hey Jarvis"). Operating at a sample rate of 16 kHz with a chunk size of 1280 samples, the engine performs inference every 80 milliseconds. This zero-network approach ensures that no audio data leaves the device until the wake word is confidently detected, preserving user privacy. Upon detection, a local alert sound is played, and the system transitions to recording mode.

#### Speech-to-Text (STT)
Captured audio is processed by **Faster-Whisper**, an optimized implementation of OpenAI’s Whisper model. The system uses a Voice Activity Detection (VAD) algorithm to identify the start and end of speech, avoiding the recording of long silences. The audio segment is then transcribed into text using the "small" or "large-v2" model, depending on hardware capabilities. This step converts raw acoustic signals into structured text ready for natural language processing.

#### Natural Language Processing (NLP)
Transcribed text is sent to a local instance of **Ollama** running the **Mistral-7B** large language model. The system constructs a dynamic system prompt that includes context about the smart home environment, available commands, and user-specific information. To enhance efficiency, a fuzzy matching router first checks if the input matches known command patterns (e.g., "turn on lights"). If a match is found with high confidence, the system executes the command directly via API, bypassing the LLM. Otherwise, the full text is processed by Mistral-7B to generate a contextual response and determine intent.

#### Text-to-Speech (TTS)
Responses are synthesized using **Coqui XTTS v2**, a high-quality neural TTS model. To reduce the perceived latency of speech generation, the system implements a streaming pipeline. As the LLM generates text token-by-token, complete sentences are identified and immediately sent to the TTS engine for synthesis. This overlapping of LLM generation and TTS synthesis allows the first part of the response to be spoken while the rest is still being generated, significantly improving the user experience. The audio is played through a persistent output stream to avoid gaps between chunks.

### 3.2 Biometric Security (Face Recognition)

#### Visual Input and Processing
Face recognition is handled by a separate Flask-based service that processes video streams from either a USB webcam or an ESP32-CAM module. The system captures MJPEG frames and preprocesses them for analysis.

#### Face Mapping and Verification
The core of the recognition engine is **MediaPipe FaceLandmarker**, which extracts detailed 3D facial landmarks. These landmarks are converted into embedding vectors that represent the unique geometric features of the face. Identity verification is performed using a **Scikit-Learn NearestNeighbors** classifier, which calculates the cosine similarity between the live embedding and stored profiles of authorized users. A threshold distance determines whether the face is recognized as known or unknown.

#### Liveness Checking
To prevent spoofing attacks using photographs or screens, the system implements a liveness check based on **Laplacian variance**. This algorithm measures the sharpness and texture complexity of the image. Real human faces exhibit specific depth and texture variations that result in higher variance values compared to flat 2D images. If the variance falls below a defined threshold, the system rejects the attempt as a potential spoof.

### 3.3 Interactive User Interface (UI)

#### Browser-Based Client
The user interface is a web-based application hosted on a local Python HTTP server and synchronized via WebSockets. This architecture allows for rich, interactive visuals without requiring native desktop application installation. The UI connects to the backend via a WebSocket bridge (`ui/server.py`), receiving real-time updates on system state, transcripts, and audio data.

#### Liquid Blob Visualization
A key feature of the UI is the "Liquid Blob," a dynamic visual representation of the assistant’s state. Rendered using HTML5 Canvas and WebGL, the blob changes shape, color, and intensity based on the assistant’s current mode:
*   **Dormant:** A calm, slowly morphing sphere.
*   **Listening:** Expands with wave-like ripples, reacting to ambient sound levels.
*   **Thinking:** Pulsates with internal flow patterns.
*   **Speaking:** Spikes aggressively in sync with the audio spectrum, driven by Fast Fourier Transform (FFT) analysis of the TTS output.
This audio-reactive visualization provides intuitive feedback, making the AI’s internal state perceptible to the user.

---

## 4. System Integration and Data Flow

### 4.1 Command Routing and Execution
The system bridges natural language and physical control through a structured API routing mechanism. When the NLP module identifies a device control intent, it maps the intent to a specific endpoint defined in `config.json`. For example, the command "turn on the lights" triggers a POST request to the Arduino’s IP address with the payload `{"command": "LIGHTS_ON"}`. The Arduino firmware parses this serial command and toggles the corresponding relays. This configuration-driven approach allows new devices to be added by simply updating the JSON config, without modifying the core Python code.

### 4.2 Security Protocol Execution
Access control commands, such as "open the door," trigger a specialized security workflow. Instead of executing immediately, the voice assistant pauses and invokes the face recognition API. The UI displays a "Scanning" status, and the camera feed is activated. Only upon successful verification of identity and liveness does the system send the unlock command to the Arduino. If verification fails, access is denied, and the user is notified. This multi-factor authentication (voice intent + biometric verification) ensures that physical security is not compromised by voice spoofing.

### 4.3 Emergency Override System
The system implements a strict priority hierarchy where safety overrides all other functions. When the Arduino detects fire or gas:
1.  **Hardware Interrupt:** The safety check task identifies the hazard and sets the emergency state.
2.  **Actuator Control:** Lights are turned off to prevent electrical sparks, the fan is activated, and the window is opened.
3.  **Alerts:** The buzzer sounds an alarm, and the TFT display shows a critical warning.
4.  **Software Notification:** The emergency state is broadcast via WebSocket to the UI, which switches to a red/yellow alert screen.
5.  **Voice Assistant Suspension:** Normal voice interactions are suspended until the hazard is cleared, ensuring the system focuses entirely on safety mitigation.

---

## 5. Conclusion

The Smart Home subsystem presented in this chapter demonstrates a robust integration of edge AI, real-time hardware control, and secure biometric verification. By leveraging local processing for voice and face recognition, the system achieves high performance and privacy without relying on external cloud services. The asynchronous firmware architecture ensures reliable operation of safety-critical sensors, while the modular software design allows for scalable expansion of features. This subsystem serves as a foundational component of the Smart City 2026 ecosystem, proving that intelligent, responsive, and secure residential environments are achievable through careful engineering of both hardware and software layers.