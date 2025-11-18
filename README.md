# OutdoorSpot - UTA Hiking & Camping Guide

A web application that helps University of Texas at Arlington students discover nearby hiking trails and camping spots across the Dallas–Fort Worth area.

## Project Overview

OutdoorSpot curates local outdoor experiences tailored for UTA students, highlighting drive times from campus, amenity details, budget considerations, and seasonal tips for safe adventures.

## Key Features

### Core Functionality
- **Trail & Campground Discovery**: Explore curated hiking trails and campgrounds around DFW
- **UTA-Centric Insights**: Highlight drive times and transportation options from campus
- **Advanced Filtering**: Filter by distance, terrain, amenities, fees, and accessibility
- **Seasonal Guidance**: Weather preparation tips specific to North Texas conditions
- **Student Reviews & Ratings**: Crowd-sourced recommendations and trip notes
- **Interactive Maps**: Browse results visually with map markers and detail overlays

### Filtering & Search
- **Distance-based**: Filter by drive time from UTA or a custom location
- **Terrain Types**: Prairie, forest, lakeside, and river trails common to DFW
- **Seasonal Considerations**: Check trail conditions by season and weather outlook
- **Budget Options**: Discover free parks, day-use passes, or overnight permit costs
- **Difficulty Levels**: Match hike length and elevation gain to student skill levels
- **Amenities**: Restrooms, water access, camping hookups, pet-friendly sites, and more

### User Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop use
- **Interactive Maps**: Leaflet-powered map with custom markers and tooltips
- **Detailed Profiles**: Safety notes, packing checklists, and amenity highlights
- **Favorite Spots**: Save and revisit preferred trails or campsites
- **Trip Preparation**: Shareable packing lists and quick-start guides for student groups
- **Community Features**: Reviews, photos, and trail updates from fellow Mavericks

## Technology Stack

### Frontend
- **Next.js 15** – Full-stack React framework with file-based routing
- **React 19** – Modern UI with concurrent rendering capabilities
- **TypeScript** – Type-safe components and utilities
- **Tailwind CSS 4** – Utility-first styling
- **Leaflet & React Leaflet** – Interactive maps and geospatial visualization

### Backend
- **Node.js 18+** – JavaScript runtime
- **Express.js** – RESTful API server
- **PostgreSQL** – Primary relational data store
- **Prisma** – Type-safe ORM and schema migrations
- **JWT Authentication** – Secure session management

### External Services
- **OpenStreetMap Tiles** – Map baselayers rendered via Leaflet
- **National Weather Service API** – Localized weather and safety alerts
- **Recreation.gov & Texas Parks APIs** – Official camping and permit data

### Development & Deployment
- **Docker & Docker Compose** – Local development and deployment parity
- **GitHub** – Source control and issue tracking
- **Render** – Managed hosting for production services

## Project Structure

```
outdoor-spot/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Next.js pages and API routes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # Global styles and Tailwind config
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── shared/                  # Shared types and utilities
├── docker-compose.yml      # Production-oriented compose stack
├── docker-compose.dev.yml  # Local development compose stack
├── .github/                # GitHub Actions workflows
└── README.md
```

## Database Schema

### Core Entities
- **Users**: Authentication and student profile information
- **Locations**: Hiking trails, state parks, and campgrounds near DFW
- **Amenities**: Water, restrooms, electric hookups, and accessibility metadata
- **Permits & Fees**: Pass requirements and reservation availability
- **Reviews**: Student-submitted ratings and trip notes
- **Safety Alerts**: Weather, burn bans, and trail closures

### Key Relationships
- Users can review multiple locations and share safety updates
- Locations reference relevant amenities and permit requirements
- Safety alerts and seasonal tips are tied to specific locations
- Users can bookmark locations for quick trip planning

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
-  Establish development environment and repository standards
-  Scaffold Next.js frontend and Express.js backend services
-  Define initial Prisma schema and seed DFW trail data
-  Implement authentication and student profile onboarding
-  Build core layout, navigation, and shared UI components

### Phase 2: Core Features (Weeks 3-4)
-  Implement hiking and camping search with filters
-  Integrate Leaflet maps for spatial browsing
-  Build location detail pages with amenity and fee information
-  Launch user profile settings and favorites

### Phase 3: Enhanced Features (Weeks 5-6) **(Current Phase)**
-  Expand filtering to include seasonal tips and safety alerts
-  Launch student review and rating workflows
-  Surface recommended gear lists and packing checklists
-  Automate weather and burn ban notifications per location

### Phase 4: Polish & Launch (Weeks 7-8)
-  Performance and accessibility optimization
-  Comprehensive testing and QA
-  Content review and data verification
-  Production deployment and monitoring setup

## Getting Started

### Prerequisites
- Docker (with the Compose plugin providing the `docker compose` CLI)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/outdoor-spot.git
   cd outdoor-spot
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   # Update credentials such as database URLs and API keys as needed
   ```

3. **(Optional) Generate local-only overrides**

   To point the stack at a LAN-accessible backend/frontend while keeping the production values intact, use the helper script:

   ```bash
   npm run setup:dev-env
   ```

   The script creates `.env.local` at the repository root for the backend and `frontend/.env.local` for the Next.js app. These files shadow the production URLs only on your machine, enabling local testing without modifying `.env`.

4. **Build and start with Docker**

   Production deployments still rely on the existing `web` reverse-proxy network, so the
   base compose file keeps that external dependency intact. For local development use the
   dedicated compose file that omits the external network and publishes the container
   ports directly to your machine:

   ```bash
   npm run docker:dev
   ```

   The helper automatically rebuilds images before starting the stack so your local
   changes are picked up.

   If you're deploying alongside the production proxy network, continue using the
   original command:

   ```bash
   docker compose build
   docker compose up -d
   ```

4. **View application logs (optional)**
   ```bash
   docker compose logs -f
   ```

## Data Sources

### Initial Data Collection
- **Recreation.gov & Texas Parks and Wildlife**: Official campground data and permits
- **City of Arlington & DFW Parks Departments**: Local trail and park amenities
- **Community Contributions**: Student-submitted trail notes and campsite reviews
- **Manual Curation**: Faculty and outdoor club recommendations

### Ongoing Data Management
- **User Reviews**: Student feedback ensures current trail and campsite conditions
- **Moderation System**: Admin review of safety notes, alerts, and shared itineraries
- **Data Validation**: Automated and manual verification
- **Regular Updates**: Seasonal information and availability

## Design System

### Color Palette
- **Primary**: Forest Green (#2D5016)
- **Secondary**: Sky Blue (#87CEEB)
- **Accent**: Sunset Orange (#FF6B35)
- **Neutral**: Charcoal (#36454F)
- **Background**: Off-white (#FAFAFA)

### Typography
- **Headings**: Inter (Google Fonts)
- **Body**: System font stack
- **Monospace**: Fira Code

### Components
- **Cards**: Location and activity previews
- **Maps**: Interactive location browsing
- **Filters**: Advanced search and filtering
- **Forms**: User input and data collection
- **Navigation**: Intuitive site structure

## Security Considerations

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **Rate Limiting**: API request throttling
- **CORS**: Cross-origin resource sharing configuration
- **HTTPS**: Secure data transmission
- **Privacy**: GDPR compliance for user data

## Performance Optimization

- **Image Optimization**: WebP format, lazy loading
- **Code Splitting**: Route-based and component-based
- **Caching**: Redis for API responses, CDN for static assets
- **Database**: Indexing, query optimization
- **Monitoring**: Performance tracking and alerting

##Testing Strategy

- **Unit Tests**: Jest for utility functions and components
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows
- **Performance Tests**: Load testing with Artillery
- **Accessibility**: WCAG 2.1 compliance testing



## License

MIT License - see LICENSE file for details

---

