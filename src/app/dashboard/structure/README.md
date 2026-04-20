# Organization Structure Builder

A visual organization structure builder integrated into the admin dashboard.

## Features

### Template Entities
- **Corporate**: Top-level organization entity (CEO level)
- **Division**: Major organizational divisions
- **Department**: Departmental units
- **Unit**: Team or unit level
- **Employee**: Individual employee level
- **Custom**: Add custom entity types

### Template Roles
- **CEO**: Chief Executive Officer
- **Director**: Division/Department Director
- **Manager**: Department/Unit Manager
- **Team Leader**: Team/Unit Leader
- **Employee**: Individual contributor
- **Custom**: Add custom role types

### Visual Builder
- **Drag and Drop**: Visual node-based structure builder
- **Zoom Controls**: Zoom in/out and fit to screen
- **Undo/Redo**: Full history management
- **Node Actions**:
  - Add child nodes
  - Edit node details
  - Duplicate nodes
  - Delete nodes
- **Color Coding**: Different colors for different hierarchy levels
- **Responsive**: Works on all screen sizes

## Usage

1. Navigate to `/dashboard/structure` in the admin dashboard
2. Use the left sidebar to view template entities and roles
3. Click the "+" button on any node to add a child
4. Use the toolbar to zoom, undo/redo, and save
5. Click on nodes to edit their details or assign roles

## Design System

### Colors
- **Corporate (Level 0)**: `#5B5BF7` (Primary Blue)
- **Division (Level 1)**: `#8B5CF6` (Purple)
- **Department (Level 2)**: `#EC4899` (Pink)
- **Unit (Level 3)**: `#F43F5E` (Rose)
- **Employee (Level 4)**: `#EF4444` (Red)

### Typography
- Node names: 14px, medium weight
- Subtitles: 12px, regular weight
- Sidebar headings: 14px, semibold

### Spacing
- Node padding: 12px horizontal, 12px vertical
- Node gap: 64px horizontal
- Level gap: 32px vertical

## Components

- `StructureBuilder`: Main canvas and toolbar
- `StructureNode`: Individual node component
- `TemplateEntities`: Left sidebar entity templates
- `TemplateRoles`: Left sidebar role templates
- `AddNodeDialog`: Modal for adding new nodes

## Permissions

Requires `nav:dashboard` permission to access the structure page.
