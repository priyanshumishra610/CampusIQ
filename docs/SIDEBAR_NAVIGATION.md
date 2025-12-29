# Sidebar Navigation System Documentation

## Overview

CampusIQ features a premium, role-based sidebar navigation system that provides an enterprise-grade user experience. The sidebar is dynamically rendered based on user roles and adapts to different screen sizes.

## Architecture

### Components

1. **Sidebar Component** (`app/components/Common/Sidebar.tsx`)
   - Main sidebar UI component
   - Dark/glass theme with gradient backgrounds
   - Active tab highlighting with glow effects
   - Responsive design (collapsible on tablet/desktop)

2. **SidebarLayout Component** (`app/components/Common/SidebarLayout.tsx`)
   - Wrapper component for responsive sidebar layout
   - Handles mobile (drawer) vs tablet/desktop (fixed) modes

3. **Sidebar Configuration** (`app/config/sidebarConfig.ts`)
   - Role-based navigation configurations
   - Centralized menu item definitions
   - Easy to extend and maintain

### Navigation Structure

The sidebar integrates with React Navigation using:
- **Drawer Navigator**: For mobile devices (overlay sidebar)
- **Fixed Sidebar**: For tablet/desktop (permanent sidebar)
- **Stack + Tab Navigators**: Existing navigation structure remains intact

## Role-Based Sidebars

### STUDENT
- Dashboard
- Timetable
- Attendance
- Assignments
- Exams
- Performance
- Announcements

### FACULTY
- Dashboard
- Attendance Manager
- Assignments Manager
- Class Intelligence
- Announcements
- Reports

### ADMIN
- Executive Dashboard
- Exams
- Campus Map
- Crowd Heatmap
- Create Task

### SUPPORT
- Support Dashboard
- Tickets
- Analytics

### SECURITY
- Security Console
- SOS Alerts
- Live Incidents
- Geo Fence Monitor

## Features

### Visual Design
- **Dark Theme**: Deep blue gradient background (`rgba(12, 18, 34, 0.98)`)
- **Glass Effect**: Subtle blur and transparency
- **Active State**: Rounded pill with gradient glow
- **Icons**: Material Icons from `react-native-vector-icons`
- **Typography**: Poppins font family with proper weights

### Responsive Behavior
- **Mobile (< 768px)**: Drawer navigation (overlay)
- **Tablet/Desktop (≥ 768px)**: Fixed sidebar (permanent)
- **Collapsible**: Sidebar can collapse to icon-only mode on tablet/desktop

### Interactive Elements
- **Hover Effects**: Smooth transitions on menu items
- **Active Highlighting**: Current route is highlighted with accent color
- **Badge Support**: Optional badge counts for notifications
- **Section Headers**: Grouped menu items with section labels

## Usage

### Basic Integration

The sidebar is automatically integrated into the navigation system via `RootNavigator.tsx`. Each role-based navigator uses a drawer navigator that renders the sidebar as drawer content.

### Adding New Menu Items

1. Open `app/config/sidebarConfig.ts`
2. Find the appropriate role configuration
3. Add a new item to the `menuItems` array:

```typescript
{
  id: 'new-feature',
  label: 'New Feature',
  icon: 'icon-name', // Material Icons name
  route: 'RouteName', // Must match navigation route
  section: 'Optional Section', // Optional section header
  badge: 5, // Optional badge count
}
```

### Customizing Styles

The sidebar uses design tokens from `app/theme/designTokens.ts`. To customize:

1. **Colors**: Modify `Colors` object in `designTokens.ts`
2. **Typography**: Adjust `Typography` settings
3. **Spacing**: Update `Spacing` values
4. **Component Styles**: Edit `styles` object in `Sidebar.tsx

### Route Configuration

Menu items must use route names that match your navigation structure:

- **Tab Routes**: Use the tab screen name (e.g., `'Dashboard'`, `'Timetable'`)
- **Stack Routes**: Use the stack screen name (e.g., `'PerformanceDashboard'`)
- **Nested Routes**: Use dot notation (e.g., `'StudentHome.Dashboard'`)

## Technical Details

### Navigation Flow

1. User clicks sidebar menu item
2. `handleNavigate` is called with the route name
3. Navigation attempts:
   - Direct navigation to route
   - Nested navigation (parent → child)
   - Tab navigation (home → tab)
4. Drawer closes automatically on mobile after navigation

### Active Route Detection

The sidebar uses `useRoute()` hook to detect the current route and highlight the active menu item. The `isActive` function compares:
- Exact route name match
- Route name contains (for nested routes)

### Performance

- **Memoization**: Menu items and handlers are memoized
- **Lazy Rendering**: Sections render only when needed
- **Optimized Re-renders**: Uses React hooks efficiently

## Extending the Sidebar

### Adding a New Role

1. Create a new config in `sidebarConfig.ts`:
```typescript
export const newRoleSidebarConfig: SidebarConfig = {
  role: 'NEW_ROLE',
  menuItems: [...],
  bottomItems: [...],
};
```

2. Add to `getSidebarConfig` function:
```typescript
case 'NEW_ROLE':
  return newRoleSidebarConfig;
```

3. Create corresponding navigator in `RootNavigator.tsx`

### Adding Badges/Notifications

Update menu items with badge counts:
```typescript
{
  id: 'notifications',
  label: 'Notifications',
  icon: 'notifications',
  route: 'Notifications',
  badge: unreadCount, // Dynamic count
}
```

The sidebar will automatically display badges when `badge > 0`.

## Troubleshooting

### Sidebar Not Appearing
- Check that user role is correctly set in Redux state
- Verify drawer navigator is properly configured
- Ensure screen width detection is working

### Navigation Not Working
- Verify route names match navigation structure
- Check console for navigation errors
- Ensure route exists in the appropriate navigator

### Styling Issues
- Check design tokens are loaded
- Verify design token values are correct
- Check for style conflicts with other components

## Best Practices

1. **Route Naming**: Use consistent, descriptive route names
2. **Icon Selection**: Choose Material Icons that clearly represent the feature
3. **Section Grouping**: Group related items with section headers
4. **Performance**: Keep menu items list reasonable (< 15 items)
5. **Accessibility**: Ensure labels are clear and descriptive

## Future Enhancements

Potential improvements:
- Search functionality within sidebar
- Recent items/favorites
- Customizable sidebar order
- Keyboard shortcuts
- Multi-level navigation support

