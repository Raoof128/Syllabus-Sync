# Design System Documentation

**Comprehensive UI/UX Design Guidelines for The Syllabus Sync**

## 🎨 Design Philosophy

### **Core Principles**

- **Academic Excellence:** Design for educational workflows and student needs
- **Mobile First:** Responsive design optimized for mobile student experience
- **Accessibility Always:** WCAG 2.1 AA compliance as default, not add-on
- **Performance Obsessed:** Fast, lightweight interactions with measurable metrics
- **Inclusive Design:** Support for diverse student populations and needs

## 🎯 Brand Identity

### **Macquarie University Integration**

- **Primary Colors:** University-sanctioned Macquarie palette
- **Typography:** Optimized for academic content readability
- **Iconography:** Consistent with University brand guidelines
- **Voice:** Professional yet approachable for student engagement

### **Visual Hierarchy**

- **Information Architecture:** Clear content organization for quick scanning
- **Action Prioritization:** Primary actions prominently displayed
- **Progressive Disclosure:** Information revealed progressively
- **Contextual Help:** Guidance available at point of need

## 🎚 Component Library

### **Atomic Design System**

#### **Base Components**

```tsx
// Foundation components with consistent API
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

#### **Magic Card System**

```tsx
// Premium glass morphism design
interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  interactive?: boolean;
  glow?: boolean;
}
```

#### **Form Components**

```tsx
// Consistent form patterns
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}
```

### **Design Tokens**

#### **Color Palette**

```css
:root {
  /* MQ Brand Colors */
  --mq-primary: #1a4b8c;
  --mq-secondary: #4a5568;
  --mq-accent: #ff6b35;
  --mq-background: #f8f9fa;
  --mq-surface: #ffffff;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Neutral Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;

  /* Liquid Glass Variables */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}
```

#### **Typography Scale**

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

#### **Spacing System**

```css
:root {
  /* 4px base unit */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
}
```

## 🖼️ Icon System

### **Lucide React Integration**

```tsx
// Standardized icon usage
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Bell,
  Settings,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// Usage example
<Calendar size={20} className="text-mq-primary" />;
```

### **Custom Campus Icons**

```tsx
// Macquarie-specific icons
interface CampusIconProps {
  building: 'library' | 'lecture-theater' | 'cafeteria' | 'gym';
  status?: 'open' | 'closed' | 'maintenance';
}

// Implementation with SVG paths
<BuildingIcon building="library" status="open" />;
```

## 🌊 Liquid Glass Effects

### **Background Animations**

```css
.liquid-glass {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.liquid-glass:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(31, 38, 135, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

### **Interactive Elements**

```css
.liquid-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.liquid-button:hover::before {
  width: 300px;
  height: 300px;
}
```

## 📱 Responsive Design

### **Breakpoint System**

```css
:root {
  --breakpoint-sm: 640px; /* Mobile */
  --breakpoint-md: 768px; /* Tablet */
  --breakpoint-lg: 1024px; /* Small Desktop */
  --breakpoint-xl: 1280px; /* Desktop */
  --breakpoint-2xl: 1536px; /* Large Desktop */
}

/* Mobile-first approach */
.component {
  /* Mobile styles */
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .component {
    /* Tablet and up */
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop and up */
    padding: var(--space-8);
  }
}
```

### **Container Layouts**

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-fluid {
  width: 100%;
  padding: 0 var(--space-4);
}
```

## ♿ Accessibility Guidelines

### **WCAG 2.1 AA Compliance**

```css
/* Minimum touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-2) var(--space-3);
}

/* Focus indicators */
.focus-visible {
  outline: 2px solid var(--mq-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .component {
    border: 2px solid var(--mq-primary);
    background: var(--mq-background);
    color: var(--mq-primary);
  }
}
```

### **Reduced Motion Support**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .liquid-glass::before {
    transition: none !important;
  }
}
```

## 🎪 Micro-interactions

### **Loading States**

```tsx
const LoadingState = () => (
  <div className="animate-pulse flex items-center justify-center">
    <div className="h-8 w-8 bg-mq-primary/20 rounded-full animate-spin"></div>
    <span className="ml-2 text-mq-content-secondary">Loading...</span>
  </div>
);
```

### **Hover & Focus States**

```css
.interactive-element {
  transition: all 0.2s ease;
  cursor: pointer;
}

.interactive-element:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.interactive-element:focus {
  outline: 2px solid var(--mq-primary);
  outline-offset: 2px;
}
```

### **Error & Success States**

```tsx
const StatusMessage = ({ type, message }) => (
  <div
    className={clsx(
      'p-4 rounded-lg border',
      type === 'error' && 'bg-red-50 text-red-700 border-red-200',
      type === 'success' && 'bg-green-50 text-green-700 border-green-200',
      type === 'warning' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
    )}
  >
    <div className="flex items-center">
      {type === 'error' && <AlertCircle className="mr-2 h-5 w-5" />}
      {type === 'success' && <CheckCircle className="mr-2 h-5 w-5" />}
      {type === 'warning' && <AlertTriangle className="mr-2 h-5 w-5" />}
      <span>{message}</span>
    </div>
  </div>
);
```

## 🎨 Usage Examples

### **Dashboard Cards**

```tsx
const DashboardCard = ({ title, value, trend, icon: Icon }) => (
  <MagicCard className="p-6 hover:scale-105 transition-transform">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-mq-content">{title}</h3>
      <div className="flex items-center text-mq-content-secondary">
        {icon && <icon className="w-4 h-4 mr-2" />}
        <span className="text-2xl font-bold text-mq-primary">{value}</span>
        {trend && <TrendingUp className="w-4 h-4 ml-2 text-green-500" />}
      </div>
    </div>
  </MagicCard>
);
```

### **Form Layouts**

```tsx
const FormLayout = ({ title, children, actions }) => (
  <div className="max-w-md mx-auto">
    <MagicCard className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-mq-content mb-2">{title}</h2>
      </div>

      <div className="space-y-4">{children}</div>

      {actions && <div className="flex justify-end space-x-3 mt-6">{actions}</div>}
    </MagicCard>
  </div>
);
```

## 📚 Implementation Guidelines

### **Component Development**

1. **Start with Design System:** Always check for existing components
2. **Use Design Tokens:** Reference CSS variables, avoid hardcoded values
3. **Mobile First:** Design for smallest screen first, enhance upward
4. **Test Accessibility:** Use screen readers, keyboard navigation
5. **Performance Consideration:** Minimize re-renders, optimize images

### **Consistency Rules**

- Use `clsx` for conditional styling
- Follow naming conventions for props and classes
- Maintain consistent spacing and typography
- Implement proper error boundaries
- Use semantic HTML elements

## 🔍 Design Review Process

### **Checklist**

- [ ] Design follows MQ brand guidelines
- [ ] Color contrast meets WCAG standards
- [ ] Typography is readable and accessible
- [ ] Mobile responsiveness tested
- [ ] Interactive elements have clear states
- [ ] Loading and error states implemented
- [ ] Motion respects user preferences
- [ ] Design system tokens used consistently

### **Review Tools**

- **Figma:** Component design and prototyping
- **Chrome DevTools:** Performance and accessibility audit
- **WAVE/Focus:** Accessibility validation tools
- **Lighthouse:** Performance and best practices testing
- **Responsive Design Mode:** Mobile/tablet/desktop testing

---

**Designed with 💜 for Macquarie University students**

_For component usage examples, see the component library in `/components/ui/`_
