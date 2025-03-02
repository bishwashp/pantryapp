# Pantry Tracker App

This app helps you track pantry inventory levels. It runs locally on macOS using Electron, with data stored in SQLite and analytics visualized with Chart.js. The app is designed to be responsive and follows a minimalistic, iOS-inspired design.

## Features
- **Home Page**: Displays categories with fill gauges sorted by replenishment levels.
- **Analytics Page**: Shows stock trends over time with day/week/month views.
- **Settings Page**: Manage stocks and categories with add/edit/delete functionality.
- **Local Execution**: Runs without manually starting a server.
- **Packageable**: Can be built into a `.dmg` file for distribution.

## Requirements
- macOS
- Node.js and npm installed

## Installation
1. Clone or download the project to your local machine.
2. Navigate to the project directory:
   ```bash
   cd pantry-tracker