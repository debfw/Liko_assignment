# World Shipping Network Visualization

An interactive visualization of global shipping connections between major cities using Next.js, GoJS, and Mantine UI.

## Features

- **Interactive World Map**: Visualize shipping routes between major cities worldwide
- **GoJS Diagram Tools** (controlled via toolbar buttons):
  - **Dragging Tool**: When enabled, move nodes freely around the diagram
  - **Linking Tool**: When enabled, create new shipping routes by dragging between nodes
  - **Relinking Tool**: When enabled, modify existing routes by dragging link endpoints
- **Dynamic Node Sizing**: Nodes scale based on city population with real-time resize controls
- **Multiple Shipping Methods**: Different visual styles for truck, air, and ship routes
- **Advanced Filtering**: Filter by region, search cities, and filter by shipping method
- **Dark Theme**: Modern dark interface with high contrast colors
- **Responsive Controls**: Intuitive sliders for node size and link opacity
- **Context Menus**: Right-click functionality for nodes and links
- **Auto-save**: State persistence using Zustand store
- **Performance Optimized**: Efficient rendering with GoJS diagram optimizations

## Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

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
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Mantine provider
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── WorldMapDiagram.tsx    # Main visualization component
│   ├── SaveStateIndicator.tsx # Auto-save status indicator
│   └── KeyValuePair.tsx       # Reusable key-value display
├── stores/                # State management
│   └── saveStateStore.ts  # Zustand store for persistence
├── types/                 # TypeScript definitions
│   └── gojs-types.ts     # GoJS data types
├── utils/                 # Utility functions
│   ├── coordinates.ts    # Lat/lng to diagram conversion
│   ├── regions.ts        # Region detection and colors
│   └── shipping.ts       # Shipping route generation
└── theme/                # UI theme configuration
    └── index.ts         # Mantine theme settings
```

## Design Decisions

### 1. Technology Stack (and Why I Chose It)

- **Next.js 15**: The latest React framework delivering optimized performance, intuitive file-based routing, and an enhanced developer experience (DX).
- **GoJS**: I have to (assigned).
- **Mantine UI**: TypeScript-first React component library offering powerful theming, responsive design, built-in hooks, and a clean developer experience
- **TypeScript**: Type safety and better developer experience
- **Zustand**: Lightweight state management for persistence

### 2. Data Structure

- Cities are loaded from `public/worldcities.json` with population data
- Shipping routes are dynamically generated based on:
  - Geographic proximity
  - Region boundaries
  - Population thresholds
- Node sizes are determined by population (25px, 35px, or 45px base size)

### 3. Interaction Design

- **Click**: Select nodes/links and update detail panels
- **Tool Controls** (disabled by default, enable via buttons):
  - **Drag Nodes button**: When enabled, move nodes around the diagram
  - **Create Links button**: When enabled, click and drag from one node to another to create new shipping routes
  - **Relink button**: When enabled, drag link endpoints to different nodes
- **Ctrl+Click+Drag**: Resize nodes dynamically
- **Right-click**: Context menus for font size adjustments
- **Hover**: Visual feedback with red borders and link highlighting
- **Drag sliders**: Real-time adjustment of node sizes and link opacity

## Performance Considerations

### 1. Rendering Optimizations

- **Fixed bounds**: Prevents unnecessary recalculations with `fixedBounds`
- **Conditional rendering**: Links only update when visible

### 2. Data Management

- **Lazy loading**: Cities loaded asynchronously after component mount
- **Filtered rendering**: Only visible nodes and links are processed
- **Memoized calculations**: Base sizes cached to avoid recalculation
- **Efficient updates**: GoJS model commits batch changes

### 3. State Optimization

- **Debounced saves**: Auto-save triggers are throttled
- **Selective updates**: Only affected elements re-render
- **Shallow comparisons**: React hooks optimized with dependency arrays

### 4. Memory Management

- **Cleanup on unmount**: Event listeners and diagram references cleared
- **Limited search results**: Autocomplete shows max 10 cities
- **Viewport culling**: GoJS automatically handles off-screen elements

### 5. User Experience

- **Responsive sliders**: 0.1s transitions for smooth feedback
- **Hover states**: Instant visual feedback without layout shifts
- **Disabled states**: Clear visual indicators for unavailable actions
