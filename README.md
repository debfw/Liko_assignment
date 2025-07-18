# World Shipping Network Visualization

A modern, interactive visualization of global shipping connections between major cities, built with Next.js, GoJS, Mantine UI, and Zustand.

## Features

- **Interactive World Map**: Visualizes shipping routes between major cities, with dynamic node placement and scaling.
- **Diagram Controls**: Enable/disable node dragging, create or relink shipping routes, all with confirmation prompts and custom GoJS tool logic.
- **Dynamic Node Sizing**: Node size reflects city population, adjustable in real time.
- **Shipping Methods**: Visual distinction and filtering for truck, air, and ship routes.
- **Search & Filter**: Fast, in-diagram search and filtering by city, country, or shipping method.
- **Context Menus**: Right-click for quick actions on nodes/links.
- **Zoom & View Controls**: Zoom-to-fit, reset, and real-time link opacity/thickness adjustments.
- **Auto-save**: All diagram changes are persisted with debounced, visual save-state feedback.
- **Dark Theme**: Custom Mantine theme for a modern, accessible UI.
- **Performance Optimized**: Memoized calculations, lazy data loading, and selective rendering for large datasets.

## Technical Highlights

- **Next.js 15**: App directory, SSR/CSR hybrid, MantineProvider for theming.
- **GoJS**: Custom diagram setup, tool management, and event handling for interactive diagrams.
- **Zustand**: Modular state stores for diagram, filters, UI controls, context menus, and save state.
- **Custom Hooks**: Encapsulate all business logic for diagram interactions, filtering, and shipping route management.
- **TypeScript**: Strict typing for all code, including GoJS data models and UI state.
- **Extensible & Modular**: Easily add new features by extending hooks and store modules.

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Liko_Assignment
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/         # Next.js app directory (layout, entrypoint)
├── components/  # React components (diagram, controls, UI)
├── stores/      # Zustand state management modules
├── hooks/       # Custom hooks for diagram logic and state
├── types/       # TypeScript types and GoJS data models
├── utils/       # Utility functions (coordinates, regions, shipping)
└── theme/       # Mantine theme configuration
```

## For Interviewers

- **Hooks-first, modular architecture**: All business logic is encapsulated in custom hooks and Zustand stores.
- **Modern UI/UX**: Accessible dark theme, responsive controls, and real-time feedback for all user actions.
- **Performance**: Optimized for large datasets with memoization and lazy loading.
- **Tested**: Key components covered by unit tests (`src/components/__tests__`).

---

_All stylings, node calculations, and tests were done by Claude—otherwise, I'd still be struggling to center a div (just kidding, don't worry!)_
