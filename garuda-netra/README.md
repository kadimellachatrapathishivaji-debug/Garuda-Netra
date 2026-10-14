# 🦅 Garuda Netra (Eagle Eye) — National Missing Vehicle Tracking System

> **Government of India • Ministry of Road Transport & Highways (MoRTH) • CCTNS Inter-Agency Integration**  
> An ultra-responsive, real-time command center MVP designed for Indian Law Enforcement agencies and Vehicle Owners to track missing or stolen vehicles across India using AIS-140 GPS telemetry, NHAI FASTag toll plazas, and Smart City ANPR camera checkpoints.

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** React 18 + TypeScript + Vite 5
- **Styling & Theme:** Tailwind CSS (Dark tactical "Command Center" aesthetic with `#f59e0b` amber alert accents, `#10b981` emerald telemetry indicators, and `#0f172a` slate base)
- **Map Engine:** Leaflet.js (`react-leaflet` 4.2) with CartoDB Dark Matter tiles, custom SVG DivIcons, polyline motion trails, and interactive toll/camera pins
- **Icons:** Lucide React
- **Document Export:** jsPDF + jspdf-autotable (Official Law Enforcement CCTNS Tracking Dossier)
- **State Management:** Custom React Contexts (`AuthContext`, `TrackingContext`) + AIS-140 GPS Simulation Hook with realistic Haversine interpolation, heading calculations, and signal jitter.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure **Node.js (v18+)** and **npm** or **pnpm** are installed on your machine.

### 2. Installation & Running
```bash
# Navigate to the project directory
cd C:\Users\LENOVO\.gemini\antigravity\scratch\garuda-netra

# Install all dependencies
npm install

# Start the Vite development server
npm run dev
```
The application will launch automatically at **`http://localhost:3000`**.

---

## 🔑 Demo Access Credentials

The application is pre-configured with instant demo authentication so you can test all user flows without external API keys or carrier SMS costs:

### 1. 🛡️ Vehicle Owner Portal
- **Indian Mobile Number:** `9876543210` (or any valid 10-digit number starting with 6, 7, 8, or 9)
- **Simulated OTP:** `123456`
- **One-Click Demo Helper:** Click **"Fill Demo Mobile"** or **"Fill Demo OTP"** on the screen.

### 2. 👮 Law Enforcement / Police Portal
- **Official Email:** `rajesh.kumar@delhipolice.gov.in` (accepts any `@gov.in`, `@police.gov.in`, or `@nic.in` domain)
- **Badge / Service ID:** `DL-POL-4402`
- **Department:** `Delhi Police` (or choose from 23 State Police Departments & Central Agencies)
- **Rank:** `Inspector` (or Sub Inspector, DSP, SP, etc.)
- **Password:** Any password (e.g. `Police@123`)
- **One-Click Demo Helper:** Click **"Quick Fill Demo Officer"** on the screen.

---

## 🚗 Pre-Loaded Test Vehicles

Four realistic vehicles are pre-configured to demonstrate all tracking conditions:

| Registration No | Vehicle Model & Class | GPS Telemetry Status | Simulation Route / Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **`AP03TC4590`** | Tata Prima 4928.S (Heavy Truck) | 🟢 **ACTIVE** (AIS-140) | Live moving telemetry along **NH-48 (Tirupati–Chennai Highway)**. Speed 40–70 km/h with live heading & altitude. |
| **`DL04CA8821`** | Hyundai Creta SX(O) (SUV) | 🟢 **ACTIVE** (OEM eSIM) | Live navigation around **New Delhi NCR & Noida Expressway / DND Flyway**. |
| **`KA01MB1029`** | Mahindra Scorpio S11 (SUV) | 🟡 **TAMPERED / OFFLINE** | **Battery Tamper Alert** triggered at Electronic City, Bengaluru. Automatically activates **NHAI FASTag Fallback** (Electronic City & Attibele Toll Plazas) and **ANPR Camera Sightings** (Hosur Rd). |
| **`MH02FZ3311`** | Bajaj Pulsar 220F (Two-Wheeler) | 🔴 **NO GPS (OFFLINE)** | No GPS chip installed. Tracks exclusively via **Smart City ANPR Traffic Cameras** (Bandra-Worli Sea Link Entry & Exit, Haji Ali Junction, Mumbai). |

> 💡 **Quick Search Tip:** You can click any of the 4 quick-select cards directly below the search bar to test instantly without manual typing.

---

## 📋 Core System Workflows

```
Role Selection Gate (Split Screen)
      │
      ├──> Vehicle Owner Portal (Mobile + OTP: 123456)
      │         │
      │         └──> Vahan Search (AP03TC4590, DL04CA8821, etc.)
      │                   │
      │                   └──> Ownership Match Check ──> Live Tactical Dashboard
      │
      └──> Law Enforcement Portal (Gov Email + Badge ID + State Dept)
                │
                └──> Vahan Search (Regex & VAHAN 4.0 Verification)
                          │
                          ├──> Option A: Standard FIR Tracking
                          │         │
                          │         ├──> Enter FIR Number
                          │         ├──> Dispatches Simulated SMS to Owner
                          │         └──> Owner Approves ──> Live Tactical Dashboard
                          │
                          └──> Option B: Emergency Warrant Override (Sec 92 CrPC)
                                    │
                                    └──> Instant Bypass (Audited) ──> Live Tactical Dashboard
```

### Step 1: Role-Gate Landing Page
- Split-screen selector between **Vehicle Owner Portal** and **Law Enforcement Portal**.
- Security badges, MoRTH & NATGRID compliance headers.

### Step 2: Vehicle Input & VAHAN Verification
- Auto-formatting search bar with regex validation (`SS DD XX DDDD`).
- Queries the simulated National Vahan Registry returning:
  - Registration Number, Registered Owner, Masked Mobile (`+91 ******3210`)
  - Vehicle Model, Class, Masked Chassis No, Engine No, Fuel Type, Registering RTO
  - AIS-140 Device IMEI & Status, FASTag ID & Status.

### Step 3: Owner Authorization & SMS Notifications
- **Citizen Owners:** Verified via phone match check before granting map access.
- **Police Officials:** Enter an FIR docket number or engage the **Emergency Warrant Override** (Sec 92 CrPC / BNSS).
- Interactive simulated SMS drawer displays carrier-delivered alerts dispatched to the owner's phone with real-time approval simulation.

### Step 4: Live "Eagle Eye" Tactical Dashboard
- **Live GPS Telemetry:** Real-time moving marker on Leaflet map with Lat/Lng, Speed (km/h), Heading (°), Altitude (m), Ignition Status (`ON`/`OFF`), and Battery Tampering detector.
- **Multi-Agency Fallback Feed:** Chronological timeline tabs for **NHAI FASTag Toll Plaza Scans** and **Smart City ANPR Optical Camera Sightings** with confidence scores.
- **Police Intercept Alert:** One-click dispatch calculating the nearest PCR patrol van and locking intercept coordinates.
- **Dossier Export:** Generate and download an official **CCTNS FIR Tracking Dossier (PDF)** or **Structured Telemetry Log (JSON)**.
- **Audit Ledger:** Immutable chronological event log with severity filtering (`INFO`, `WARNING`, `CRITICAL`).

---

## 📂 Project Structure

```
garuda-netra/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx                              # View routing & authorization orchestration
    ├── index.css                            # Tactical theme & Leaflet custom styling
    ├── types/
    │   └── index.ts                         # Complete TypeScript interfaces & domain models
    ├── data/
    │   ├── mockVehicles.ts                  # 4 Realistic VAHAN vehicle records
    │   ├── mockRoutes.ts                    # Highway GPS waypoints (NH-48, Delhi NCR, etc.)
    │   ├── mockFASTag.ts                    # NHAI toll plaza scan logs
    │   ├── mockANPR.ts                      # Smart City traffic camera sightings
    │   └── mockPoliceStations.ts            # State police depts & nearby PCR patrol units
    ├── context/
    │   ├── AuthContext.tsx                  # Citizen OTP & Police authentication provider
    │   └── TrackingContext.tsx              # Active tracking session & audit log provider
    ├── hooks/
    │   └── useGPSSimulation.ts              # Real-time AIS-140 coordinate streaming hook
    ├── utils/
    │   ├── validators.ts                    # Indian plate regex, mobile, and gov email validators
    │   └── helpers.ts                       # Haversine distance, speed color, coordinate formatters
    └── components/
        ├── auth/
        │   ├── RoleSelector.tsx             # Split-screen portal entry gate
        │   ├── OwnerLogin.tsx               # Mobile + 6-digit OTP login
        │   └── GovLogin.tsx                 # Police credential & State department login
        ├── search/
        │   ├── VehicleSearch.tsx            # Reg plate input with quick-select cards
        │   └── VahanVerificationModal.tsx   # Two-column VAHAN dossier & authorization
        ├── dashboard/
        │   ├── CommandCenter.tsx            # Main 3-column tactical command center
        │   ├── LiveMap.tsx                  # Leaflet map with animated icons & HUD
        │   ├── GPSTelemetryPanel.tsx        # High-density AIS-140 sensor stream
        │   ├── FallbackTrackingTimeline.tsx # Tabbed FASTag & ANPR fallback feeds
        │   └── ActionControls.tsx           # Intercept dispatch, PDF/JSON export, Audit log
        └── notifications/
            ├── SMSNotificationDrawer.tsx    # Slide-in carrier notification log
            └── OwnerApprovalModal.tsx       # Simulated phone approval popup with timer
```

---

## ⚖️ Legal & Privacy Notice
*Garuda Netra simulates telemetry protocols aligned with the **AIS-140 standard** mandated by the Ministry of Road Transport & Highways, Government of India. Live tracking by law enforcement without citizen approval is restricted to emergency warrant provisions under Section 92 of the Code of Criminal Procedure / Bharatiya Nagarik Suraksha Sanhita (BNSS) and is subject to mandatory judicial audit trail logging.*
