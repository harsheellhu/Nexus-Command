# Nexus Command - Intelligent Traffic Incident Co-Pilot 🚦

Nexus Command is an AI-powered traffic incident management and command center application designed for rapid emergency response and real-time intelligence synthesis. It provides an immediate, unified operational picture to city administrators, field responders, and public users.

By ingesting real-time traffic feeds across the entire Gandhinagar grid (Sectors 1-30) and applying Large Language Model (LLM) intelligence, Nexus Command automatically generates diversion routes, coordinates emergency dispatch, and mitigates congestion at critical bottlenecks within seconds.

![Nexus Command Dashboard](https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200&h=400)

## 🌟 Key Features

*   **Real-Time Incident Feed:** Ingests thousands of live traffic anomalies, reports, and camera feeds per second, automatically identifying critical priority incidents.
*   **AI Co-Pilot (Ollama):** A local LLM-driven intelligence engine that reads disaster contexts and provides actionable deployment briefings securely.
*   **Dynamic Road Relaying & Routing:** Live, turn-by-turn interactive Leaflet maps utilizing OSRM and TomTom Traffic APIs to visualize and bypass heavy congestion vectors.
*   **Multi-Role Segregation:**
    *   `Command Center Admin`: Full intelligence overview, analytics, reporting, manual injection, and AI co-pilot controls.
    *   `Field Responder`: Dedicated actionable dispatch routes and hazard overlays.
    *   `Public User`: Sanitized view with auto-routing guidance safely around blockages.
*   **Voice Interfacing:** Complete hands-free functionality for emergency responders via built-in Web Speech API input/output.
*   **Traffic Vision Engine (Computer Vision):** Advanced Python module containing YOLOv8 logic for raw data extraction from street cameras (bounding boxes, collision risk, traffic flow states).

## 🚀 Technology Stack

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
*   **Mapping:** Leaflet, React-Leaflet, Leaflet Routing Machine, OSRM API, TomTom Maps
*   **AI Integration:** Ollama (Local LLM Server, defaults to Llama 3)
*   **Computer Vision (Backend/Logic):** Python, OpenCV, NumPy, Ultralytics YOLO (Simulation scripts included in repository)

## 📁 Repository Structure

```text
/
├── src/
│   ├── components/       # Reusable React UI blocks (About Us, Routing Machine)
│   ├── services/         # API wrappers (Gemini AI service logic)
│   ├── utils/            # Massive data generators and mock payloads
│   ├── App.tsx           # Main application shell and UI logic
│   └── main.tsx          # Application entrypoint
├── cv_traffic_detection.py # Python Computer Vision Pipeline Logic
├── cv_vision_demo.html   # Standalone HTML dashboard modeling the Python CV output
├── package.json          # Node dependencies
└── vite.config.ts        # Bundler configuration
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/nexus-command.git
   cd nexus-command
   ```
2. **Install Node Dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and configure your Ollama and TomTom endpoint keys.
   ```env
   VITE_OLLAMA_ENDPOINT="http://localhost:11434"
   VITE_OLLAMA_MODEL="llama3"
   VITE_TOMTOM_API_KEY="YOUR_TOMTOM_KEY_HERE"
   ```
4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will launch on `http://localhost:3000`.*

---

## 👁️ Computer Vision Pipeline (Traffic Vision Engine)
The project includes a secondary repository folder (`cv_traffic_detection.py`) dedicated to handling the physical video feeds before they hit the React Dashboard. 
*   **What it does:** Simulates parsing RTSP cameras down SG Highway, classifying entities (`car`, `bus`, `emergency_vehicle`), calculating velocity, and extracting "Collision Risk" scenarios via Optical Flow.
*   **How to view the demo:** Open `cv_vision_demo.html` in your browser to experience a rich graphical representation of what the Python logic looks like when streaming!

## 🤝 The Team (`Codeem Code`)
Built with ❤️ during the AETRIX Hackathon (Smart Transportation Domain).
*   **Harshil Bhat** - Team Lead & UI/UX
*   **Ved Sharma** - Backend & API Developer
*   **Harshil Patel** - Backend Support Engineer
*   **Kavya Chaudhary** - Penetration Tester & Security Analyst
*   **Ansh Agarwal** - Product Designer

---
*Nexus Command © 2026. All rights reserved.*
