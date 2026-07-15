# Botanica Point of Sale (POS) System

A premium, highly polished, offline-first Point of Sale application designed with a **Natural Tones** visual identity. 

This application supports multiple cashier user roles (Admin & Cashier), a simulated high-fidelity digital payment processing terminal, stock catalog directories, customer CRM journals, and transaction ledger search logs.

---

## 🎨 Visual Identity & "Natural Tones" Styling
Following a warm, earthy garden-side palette:
*   **Brand Primary**: `#5A5A40` (Earthy deep olive)
*   **Brand Accent**: `#8FA38F` (Subtle sage green)
*   **Warm Accent**: `#E8D5B5` (Soft sand / beige)
*   **Light Background**: `#FDFCFB` (Clean off-white seed bone)
*   **Typography**: Clean sans-serif paired with a tailored serif display for headers and numerals for optimal readability.

---

## 🔐 User Authentication & Role Clearance Constraints

The POS system uses a profile selection and pincode verification system. It includes two pre-configured profiles modeling high-level store structures:

### Available POS User Profiles:
1.  **Elena Rodriguez** (Role: `Admin`)
    *   **Authorization Code**: `4321`
    *   **Privileges**: Full store directory overrides, refund restitutions, settings configuration, and sales metric dashboards.
2.  **Chen G.** (Role: `Cashier`)
    *   **Authorization Code**: `1212`
    *   **Privileges**: Standard checkout lanes, hold carts recall, list view invoices, and customer loyalty CRM.

### Privilege Access Security:
*   **Admin-Only Screens**: The **Analytics Dashboard**, **Stock Inventory**, and **Config Settings** screens are restricted. If a `Cashier` clicks on them, they will encounter a **Shift Manager Credentials Override** passcode keypad. Entering `4321` or clicking **Elevate** instantly shifts session authorities to Elena Rodriguez (Admin) so they can proceed.
*   **Refund Operations**: Voids and restitutions inside the **Invoice Journal** are locked behind a cryptographic-like check. Clicking refund with a `Cashier` account displays a notification that manager authorization is required, whereas clicking with the `Admin` account triggers the check-out restitution options immediately.

---

## 💳 Payment Processing Terminal Emulator

The POS provides comprehensive checkout and payment options accessible at checkout:
*   **Cash Flow**: Quick helper registers ($5, $10, $20, $50, $100 buttons) with automatic change-due computing logic.
*   **Digital Terminal Simulator**: Built-in payment wizard simulating real-time terminal handshakes when checking out using Credit/Debit Cards, Apple Pay, or Google Pay. It features:
    *   Dynamic payment states (Initializing Connection 📡 -> Waiting for Tap 💳 -> Transmitting Authorization 🔒 -> Settled Success ✅).
    *   Failure simulation options for sandbox testing error loops.

---

## 📦 Core Product Catalog Management

Manage store inventory items smoothly:
*   **CRUD Options**: Add, edit, and delete products easily on the fly.
*   **Metadata Integration**: Add rich product descriptions, SKU identification numbers, prices, and stock indicators.
*   **Automatic Restock Warns**: Low stock levels generate warnings inside the **Stock Directory** indicator counts.

---

## 🐳 How to Run Locally with Docker

Getting started is simple with Docker Compose, spinning up an optimized, lightweight multi-stage Alpine Nginx server.

### Prerequisites:
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Instructions:
1.  **Clone or navigate** to the project directory root.
2.  **Build and launch** the containers:
    ```bash
    docker compose up --build
    ```
3.  **Access the application** inside your browser:
    *   URL:  `http://localhost:3000`
4.  **Shutdown containers**:
    ```bash
    docker compose down
    ```

---

## 🛠️ Offline State Persistence
The application uses local storage. Reset mock values or wipe stored registries at any time in the **Config settings** menu.
