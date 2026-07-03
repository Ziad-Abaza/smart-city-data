# Chapter 9: Computer Vision-Based Smart Parking System

## 9.1 System Overview

In the context of the "Smart City 2026" ecosystem, efficient management of urban parking infrastructure is critical for reducing traffic congestion and optimizing space utilization. Traditional parking systems often rely on embedded hardware sensors—such as inductive loops or ultrasonic detectors—which are costly to install, prone to environmental degradation, and difficult to maintain at scale. To address these limitations, this subsystem implements a **Computer Vision-Based Smart Parking System** that leverages non-intrusive visual monitoring to determine slot occupancy in real time.

The system operates on a decoupled architecture that separates data acquisition from analytical processing. By utilizing standard video feeds from network-connected surveillance modules, the system eliminates the need for physical modifications to the parking lot surface. The core objective is to transform raw visual data into structured spatial intelligence, accurately mapping detected vehicles to predefined geometric parking slots. This approach not only reduces infrastructure costs but also provides a scalable framework capable of adapting to dynamic parking layouts through software configuration rather than hardware retrofitting.

## 9.2 Data Acquisition Infrastructure

The reliability of any computer vision pipeline is fundamentally dependent on the quality and consistency of its input data. The data acquisition layer is engineered to handle diverse video sources while ensuring optimal frame processing rates for real-time analysis.

### 9.2.1 Vision Ingestion Subsystem
The `Stream` class serves as the primary interface for video ingestion, abstracting the complexities of different capture devices. It supports multiple input modalities, including IP camera streams (via HTTP/MJPEG), local video files, and direct USB webcam connections. For this implementation, the system is configured to ingest live feeds from an **ESP32-CAM** module, accessed via the URL `http://192.168.0.200:81/stream`.

*   **Connection Management:** The `start_stream()` method initializes the `cv2.VideoCapture` object and verifies connectivity. If the stream fails to open, the system logs an error and prevents further execution to avoid null-pointer exceptions in downstream processes.
*   **Frame Retrieval:** The `read_frame()` method continuously pulls frames from the buffer. It includes a robust check for frame validity; if a frame is missing or corrupted, it returns `None`, allowing the main loop to skip processing for that cycle without crashing.

### 9.2.2 Image Preprocessing Module
To balance computational load with detection accuracy, the system employs dynamic resolution scaling within the `resize_frame()` method.
*   **Resolution Scaling:** A configurable scaling factor (`res`) is applied to the incoming frames. For instance, a factor of `0.5` reduces the frame dimensions by half, decreasing the pixel count by 75%. This significantly accelerates subsequent object detection steps while retaining sufficient spatial detail for vehicle identification.
*   **Interpolation:** The resizing operation utilizes OpenCV’s default interpolation algorithms to preserve edge integrity, ensuring that vehicle boundaries remain distinct for accurate bounding box generation.

## 9.3 Deep Learning Subsystem for Vehicle Detection

The core intelligence of the parking system resides in its ability to accurately detect and localize vehicles within the video frame. To achieve high performance on edge hardware, the system utilizes lightweight deep learning models optimized for inference speed.

### 9.3.1 Embedded Inference Framework (MediaPipe & TensorFlow Lite)
Rather than employing computationally expensive full-scale object detection models, the system integrates **MediaPipe** with **TensorFlow Lite (.tflite)** models. Specifically, the `efficientdet_lite0.tflite` and `ssd_mobilenet_v2.tflite` architectures are supported. These models were selected for their optimal trade-off between mean Average Precision (mAP) and inference latency, making them suitable for real-time execution on central processing units (CPUs) without requiring dedicated graphics processing units (GPUs).

*   **Detector Initialization:** The `Model` class initializes the MediaPipe `ObjectDetector` with specific options:
    *   `max_results=5`: Limits the number of detections per frame to reduce noise and processing overhead.
    *   `running_mode=VisionRunningMode.IMAGE`: Processes individual frames synchronously, providing precise control over the inference pipeline.
    *   `confidence_threshold=0.5`: Filters out weak detections, ensuring that only high-confidence predictions are considered valid vehicles.

### 9.3.2 Frame Transformation Pipeline
MediaPipe requires input images in the RGB color space, whereas OpenCV captures frames in BGR format. The `detect()` method handles this conversion seamlessly:
1.  **Color Space Conversion:** The frame is converted from BGR to RGB using `cv2.cvtColor`.
2.  **Clipping and Normalization:** Pixel values are clipped to the `[0, 255]` range and cast to `uint8` to prevent data type errors during tensor creation.
3.  **Tensor Creation:** The processed image is wrapped in a `mp.Image` object with the `SRGB` format before being passed to the detector.

### 9.3.3 Confidence Scoring and Filtering
The raw output from the neural network includes a confidence score for each detected object. The system iterates through these results and applies a strict threshold filter. Only detections with a score greater than or equal to `0.5` are retained. This step is crucial for minimizing false positives caused by shadows, reflections, or background clutter, ensuring that the subsequent spatial analysis focuses solely on verified vehicles.

## 9.4 Geometric Spatial Management Algorithms

Detecting a vehicle is only the first step; determining which specific parking slot it occupies requires precise geometric mapping. The system employs a polygon-based spatial management strategy that maps detected bounding boxes to user-defined slot regions.

### 9.4.1 Interactive Slot Configuration
To accommodate varying parking lot layouts, the system includes a dedicated visualization tool, `Drawer.py`, which allows for the interactive definition of parking slots.
*   **Polygon Definition:** Users can click on the video feed to define the vertices of each parking slot. Left-clicks add points, right-clicks finalize the polygon, and middle-clicks clear the current selection.
*   **Data Persistence:** The defined polygons, along with the original video resolution, are serialized into a JSON file (`slots.json`). This separation of configuration from code allows for easy reconfiguration of the parking layout without modifying the source code.

### 9.4.2 Dynamic Coordinate Translation
A common challenge in vision-based systems is the mismatch between the resolution used during slot configuration and the resolution of the live video stream. The `Slot` class addresses this by calculating dynamic scaling factors for every frame:
$$ ScaleFactor_X = \frac{CurrentFrameWidth}{OriginalConfigWidth} $$
$$ ScaleFactor_Y = \frac{CurrentFrameHeight}{OriginalConfigHeight} $$
These factors are applied to the stored polygon vertices, ensuring that the logical slot boundaries align perfectly with the physical space in the current video frame, regardless of resolution changes.

### 9.4.3 Occupancy Checking via Centroid Analysis
To determine occupancy, the system does not rely on simple bounding box overlap, which can be ambiguous when vehicles span multiple slots. Instead, it uses a **Centroid-Based Approach**:
1.  **Centroid Calculation:** The geometric center $(C_x, C_y)$ of each detected vehicle’s bounding box is computed.
2.  **Point-in-Polygon (PIP) Test:** The system executes a ray-casting algorithm to determine if the centroid lies within the boundaries of any defined slot polygon.
    *   The algorithm casts a horizontal ray from the centroid and counts the number of intersections with the polygon’s edges.
    *   An odd number of intersections indicates the point is **inside** (Occupied).
    *   An even number indicates the point is **outside** (Vacant).
    *   A small epsilon value ($1e-9$) is added to the denominator to prevent division-by-zero errors when the ray is parallel to an edge, ensuring numerical stability.

## 9.5 Telemetry Rendering and System Integration

The final stage of the pipeline involves synthesizing the analytical results into an intuitive visual interface for real-time monitoring and validation.

### 9.5.1 Vehicle Annotation Layer
The `annotate()` method in the `Model` class draws bounding boxes around detected vehicles. Each box is labeled with the object category (e.g., "Car") and the confidence score. This visual feedback allows operators to verify the accuracy of the detection model and identify potential issues such as missed detections or false positives.

### 9.5.2 Dynamic Slot Color-Coding
The system provides immediate visual status updates for each parking slot using color-coded polygons:
*   **Green (0, 255, 0):** Indicates a **Vacant** slot. This state is assigned when no vehicle centroid is detected within the slot’s boundaries.
*   **Red (0, 0, 255):** Indicates an **Occupied** slot. This state is triggered immediately when the PIP algorithm confirms a vehicle’s presence.
*   **Real-Time Updates:** These polygons are redrawn in every frame of the main loop, providing a seamless and responsive representation of the parking lot’s status.

### 9.5.3 Unified Real-Time Window
All visual elements—the live video feed, vehicle bounding boxes, and status-colored slot polygons—are composited into a single display window titled "Smart Parking System." The loop continues until the user presses 'q', at which point the stream is released, and resources are cleanly deallocated. This unified interface serves as both a operational dashboard and a debugging tool, allowing for immediate assessment of system performance.

## 9.6 Conclusion

The Computer Vision-Based Smart Parking System presented in this chapter demonstrates a robust, cost-effective alternative to traditional sensor-based solutions. By integrating lightweight deep learning models (EfficientDet-Lite/MediaPipe) with precise geometric algorithms (Point-in-Polygon), the system achieves high-accuracy occupancy detection without the need for invasive hardware installation. The modular design, featuring separate components for streaming, detection, and spatial management, ensures scalability and ease of maintenance.