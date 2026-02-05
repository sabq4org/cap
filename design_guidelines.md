# تصميم كبسولة - Design Guidelines

## Design Approach

**Hybrid Approach**: Healthcare Design System with Modern Web Aesthetics
- Primary inspiration: Health-focused platforms (Headspace, Calm health sections) + Linear's clean information architecture
- Core principle: Medical trust through clarity, warmth through approachable design
- RTL (Right-to-Left) Arabic support as primary design consideration

## Typography System

### Font Families
- **Primary Arabic**: 'IBM Plex Sans Arabic' (comprehensive Arabic support, modern, highly legible)
- **Secondary/English**: 'Inter' (pairs well with Arabic, clean data display)
- Load via Google Fonts CDN

### Hierarchy
- Hero Headlines: text-4xl md:text-6xl, font-bold
- Section Headers: text-3xl md:text-4xl, font-semibold
- Card Titles: text-xl md:text-2xl, font-semibold
- Body Text: text-base md:text-lg, font-normal
- Captions/Meta: text-sm, font-medium
- Chat Messages: text-base, leading-relaxed

## Layout System

### Spacing Primitives
Use Tailwind units: **4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 md:py-16 lg:py-20
- Card gaps: gap-6 md:gap-8
- Element margins: mb-4, mt-6, mx-8

### Grid & Structure
- Container: max-w-7xl mx-auto px-4 md:px-6
- Chat interface: max-w-4xl (optimal reading width)
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Health trackers: 2-column layout for data/chart pairing

## Component Library

### Navigation
- Fixed top navigation with logo (right side for Arabic), user menu (left side)
- Main navigation items: centered or right-aligned
- Mobile: Hamburger menu with slide-in drawer
- Height: h-16 md:h-20

### Chat Interface (Core Feature)
- Message bubbles: rounded-2xl, max-w-3xl
- User messages: align-right (Arabic context)
- AI responses: align-left with avatar
- Citation badges: Inline pill-shaped links with medical references
- Input area: Fixed bottom bar with rounded-full text input, h-12
- Typing indicators: Subtle animated dots

### Health Trackers
- Card-based design: rounded-xl, shadow-sm
- Data visualization: Simple line charts (Chart.js)
- Metric display: Large numbers (text-3xl) with unit labels
- Entry buttons: Prominent, easy-to-tap (min h-12)
- History view: Scrollable timeline

### Nutrition Logger
- Food entry cards: Image thumbnail + nutritional data grid
- Daily summary: Progress rings for macros (protein, carbs, fat)
- Quick-add buttons: Rounded-lg, grid layout

### Content Hub (Articles)
- Article cards: Vertical orientation, aspect-ratio-square image
- Medical review badge: Pill badge with reviewer name
- Reading time estimate: Meta information
- Source citations: Visible, linked

### Symptom Checker
- Step-by-step wizard interface
- Progress indicator: Top bar showing current step
- Question cards: Large text, button-based answers
- Severity indicator: Visual color-coding (info only, no specific colors mentioned)

### Forms
- Input fields: h-12, rounded-lg, focus:ring treatment
- Labels: text-sm font-medium, mb-2
- Buttons: h-12 md:h-14, rounded-full, font-semibold
- Validation: Inline error messages below fields

### Admin CMS
- Table-based content list: Responsive, sortable columns
- Status badges: Draft/Review/Published indicators
- Rich text editor: WYSIWYG for Arabic content
- Preview panel: Side-by-side editor/preview

## Images

### Hero Section
**Large hero image**: Full-width, aspect-ratio-16/9 on desktop, aspect-ratio-4/3 on mobile
- Image description: Diverse group of people engaging in healthy activities (walking, stretching, cooking), bright natural lighting, authentic Middle Eastern context
- Overlay: Gradient overlay for text readability
- CTA buttons on image: Use backdrop-blur-md bg-opacity-20 treatment

### Content Images
- Article thumbnails: aspect-ratio-square, rounded-lg
- Health tracking illustrations: Simple, friendly medical iconography
- Profile avatars: rounded-full, consistent sizing

### Placement Strategy
- Hero: Homepage only
- Dashboard: Icon-based, minimal imagery
- Articles: Featured image + inline illustrations
- Chat: Avatar icons, citation preview thumbnails

## Accessibility & Arabic Considerations

- Full RTL support: dir="rtl" for Arabic content
- Mirrored layouts: Reverse flex/grid directions
- Touch targets: Minimum 44x44px for all interactive elements
- Keyboard navigation: Clear focus states (focus:ring-2)
- Screen reader labels: Comprehensive aria-labels in Arabic
- Contrast: Ensure WCAG AA minimum for all text

## Responsive Breakpoints

- Mobile-first approach
- sm: 640px (compact phones)
- md: 768px (tablets)
- lg: 1024px (desktops)
- xl: 1280px (large screens)

## Animation Guidelines

**Use sparingly**:
- Page transitions: Subtle fade-in (duration-200)
- Chat messages: Slide-up entry (duration-300)
- Loading states: Skeleton screens, pulse animation
- NO scroll animations, parallax, or decorative motion
- Focus on instant responsiveness over flashy effects

---

**Key Design Principles**:
1. **Clarity First**: Medical information must be crystal clear
2. **Trust Through Simplicity**: Clean, uncluttered layouts build confidence
3. **Arabic-Native**: Design for Arabic reading patterns and cultural context
4. **Accessible Always**: Every user can access vital health information
5. **Fast & Responsive**: Health queries deserve immediate, helpful responses