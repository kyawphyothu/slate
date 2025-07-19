# Todo Thihathu 📝

A modern, feature-rich todo application built with React Native and Expo. Organize your tasks with ease using date-based scheduling, subtasks, and an intuitive interface.

## Features ✨

- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Date-based Organization**: Schedule tasks for specific dates
- **Multiple Views**: 
  - Today's tasks (main screen)
  - All tasks overview
  - Future tasks planning
- **Local Storage**: Offline-first with SQLite database using Drizzle ORM
- **Cross-platform**: Runs on iOS, Android, and web
- **Dark/Light Theme**: Adaptive theme based on system preferences

## Tech Stack 🛠️

- **Framework**: React Native with Expo
- **Navigation**: Expo Router for file-based routing
- **Database**: SQLite with Drizzle ORM
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Type Safety**: TypeScript

## Getting Started 🚀

### Prerequisites

- Node.js (22.17.0)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Open the app on your preferred platform:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal  
   - **Web Browser**: Press `w` in the terminal
   - **Physical Device**: Scan the QR code with the Expo Go app

## Usage 📱

### Main Screen (Today's Tasks)
- View tasks scheduled for today
- Add new tasks with the "+" button
- Mark tasks as complete by tapping the checkbox
- Delete tasks by tapping the delete icon
- Add subtasks to break down complex tasks

### All Tasks View
- Access via navigation to see all your tasks
- Filter and manage tasks across all dates

### Future Tasks View
- Plan ahead by viewing and managing future scheduled tasks
- Organize your upcoming workload

### Adding Tasks
1. Tap the "+" button on the main screen
2. Enter your task description
3. Select a date (defaults to today)
4. Add subtasks if needed
5. Save to create the task

## Database Schema 🗃️

The app uses SQLite with two main tables:

- **Tasks**: id, text, date, completed status
- **Subtasks**: id, taskId (foreign key), text, completed status

## Development 💻

### Project Structure
```
app/                 # Screen components (file-based routing)
├── index.tsx        # Main screen (today's tasks)
├── all-tasks.tsx    # All tasks view
├── future-tasks.tsx # Future tasks view
└── _layout.tsx      # App layout and navigation

db/                  # Database layer
├── schema.ts        # Drizzle ORM schema definitions
├── operations.ts    # Database operations
└── index.ts         # Database initialization

components/          # Reusable UI components
constants/           # App constants and themes
hooks/              # Custom React hooks
```

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start with Android simulator
- `npm run ios` - Start with iOS simulator  
- `npm run web` - Start web version
- `npm run lint` - Run ESLint

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is open source and available under the [MIT License](LICENSE).
