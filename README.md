# SyncBoard

## Project Description

SyncBoard is a real-time collaborative whiteboard application that allows multiple users to draw, write, and share ideas simultaneously. It provides a seamless experience for brainstorming, teaching, remote meetings, and project planning. The application fully supports both web and mobile platforms, allowing users to collaborate across different devices.

## Tech Stack

- **Frontend**: React 19, Socket.io-client, TailwindCSS 4
- **Backend**: Express, Socket.io, MongoDB

## Installation & Setup Instructions

To run the application locally:

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Deployed Application Link

[SyncBoard Application](https://143.198.129.20:3003/)

## Our Team

This is a collaborative team project with contributions from:

- **Vivek VV**: Design and implementation
- **Sreelekshmi C P**: Backend development
- **Sreejith A**: Brainstorming and concept development
- **Sharon Thomas**: Quality assurance and testing
- **Manikandan R**: Implementation and execution of both frontend and backend, including deployment

## Key Features

### Drawing Tools

- **Pen Tool**: Draw freehand with customizable colors
- **Sticky Notes**: Add, edit, move, and delete text notes on the canvas
- **Canvas Control**: Pan across the canvas with spacebar + mouse drag
- **Grid System**: Toggle grid visibility and adjust grid size for precise drawing

### Collaboration Features

- **Real-time Synchronization**: All changes sync instantly across all connected users
- **User Presence**: Shows who is currently connected and actively drawing
- **Drawing Lock**: Prevents multiple users from drawing simultaneously to avoid conflicts
- **User Notifications**: Displays when another user is currently drawing

### History Management

- **Undo/Redo**: Full support for reversing and restoring drawing actions
- **Action History**: Tracks user drawing history for precise undo/redo operations
- **Clear Canvas**: Option to clear the entire canvas and sync the change to all users

### User Interface

- **Cross-Platform Support**: Works seamlessly on both web browsers and mobile devices
- **Responsive Design**: Automatically adapts to different screen sizes and orientations
- **Touch Optimization**: Enhanced touch handling for drawing on mobile/tablet devices
- **Visual Feedback**: Shows active tools and user presence indicators
- **Info Modal**: Displays information about the application and currently connected users

### Backend Features

- **Socket.IO Integration**: Handles real-time bidirectional communication
- **MongoDB Connection**: Persistent storage for drawings and user data
- **Error Handling**: Graceful fallback if MongoDB connection fails
- **Server Status API**: Endpoint to check server health (/api/status)
- **Auto-recovery**: Handles reconnection and state synchronization

## Known Bugs and Limitations

### Drawing Issues

- Drawing state can occasionally get stuck if a user disconnects unexpectedly
- Very rapid drawing motions may cause points to be missed in the drawing path
- Drawing lock mechanism may sometimes prevent a user from drawing even after the previous user has stopped

### Synchronization Issues

- Occasional delay in syncing large drawings across multiple users
- Rare race conditions can occur when multiple users perform actions simultaneously
- Undo/redo operations can sometimes behave unexpectedly in multi-user scenarios

### UI/UX Issues

- Grid rendering can slow down performance with complex drawings
- Touch events on mobile sometimes register incorrectly, especially on older devices
- Canvas panning can be jerky on lower-end devices

### Backend Limitations

- Server reconnection attempts limited to 10 tries
- No authentication system implemented yet
- MongoDB connection failures can cause data persistence issues
- Limited error reporting to the client

## Technical Details

- **Frontend**: React 19, Socket.io-client, TailwindCSS 4
- **Backend**: Express, Socket.io, MongoDB
- **Deployment**: Runs on port 3002

---

_This document was prepared for code review purposes and highlights the current state of the SyncBoard application._
