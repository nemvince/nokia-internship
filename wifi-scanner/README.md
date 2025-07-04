# WiFi Scanner

## Overview

This project is a WiFi Scanner application. It is organized into backend and frontend components. The backend is responsible for scanning and providing WiFi network data, while the frontend presents this data to the user.

---

## Backend

### Description

The backend handles the logic for scanning available WiFi networks and serving this information to the frontend. It may include functions for:

- Initiating WiFi scans
- Parsing scan results
- Providing an API endpoint for the frontend to fetch scan data

### Example Functions

- `scan_wifi_networks()`: Scans for available WiFi networks and returns a list of detected networks with relevant details (SSID, signal strength, etc.).
- `parse_scan_results(raw_data)`: Processes raw scan output and structures it into a usable format.
- `get_network_details(ssid)`: Retrieves detailed information about a specific network.
- `api_get_networks()`: API endpoint that returns the list of available networks in JSON format.

---

## Frontend

### Description

The frontend provides a user interface for displaying WiFi network information retrieved from the backend. It may include components for:

- Fetching network data from the backend API
- Displaying a list of available networks
- Showing details for a selected network
- Refreshing the network list

### Example Functions/Components

- `fetchNetworks()`: Fetches the list of WiFi networks from the backend API.
- `NetworkList`: UI component that displays the list of available networks.
- `NetworkDetails`: UI component that shows detailed information about a selected network.
- `RefreshButton`: UI element that triggers a new scan and updates the network list.

---

## Usage

1. Start the backend server to enable WiFi scanning and API access.
2. Launch the frontend application to view and interact with the WiFi network data.

---

## Outputs

- List of available WiFi networks with details such as SSID, signal strength, and security type.
- Optionally, detailed information for selected networks.

---