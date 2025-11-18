# OutdoorSpot - Project Structure

This document outlines the complete file structure for the OutdoorSpot web application.

##Complete Project Structure


```
outdoor-spot/
├── README.md                           # Project overview and setup instructions
├── docker-compose.yml                  # Development environment setup
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore patterns
├── package.json                        # Root package.json for scripts
├── LICENSE                             # MIT License
│
├── frontend/                           # Next.js React Frontend
│   ├── package.json                    # Frontend dependencies
│   ├── next.config.js                  # Next.js configuration
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── .env.local.example              # Frontend environment variables
│   │
│   ├── public/                         # Static assets
│   │   ├── images/
│   │   │   ├── logos/
│   │   │   ├── icons/
│   │   │   └── placeholders/
│   │   ├── favicon.ico
│   │   └── manifest.json               # PWA manifest
│   │
│   ├── src/
│   │   ├── app/                        # Next.js 13+ App Router
│   │   │   ├── globals.css             # Global styles
│   │   │   ├── layout.tsx              # Root layout
│   │   │   ├── page.tsx                # Home page
│   │   │   ├── loading.tsx             # Loading UI
│   │   │   ├── error.tsx               # Error UI
│   │   │   ├── not-found.tsx           # 404 page
│   │   │   │
│   │   │   ├── auth/                   # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── forgot-password/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── locations/              # Location pages
│   │   │   │   ├── page.tsx            # Locations listing
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx        # Location detail
│   │   │   │   └── search/
│   │   │   │       └── page.tsx        # Search results
│   │   │   │
│   │   │   ├── activities/             # Activity pages
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── events/                 # Event pages
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── profile/                # User profile
│   │   │   │   ├── page.tsx
│   │   │   │   ├── bookmarks/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trips/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reviews/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── trips/                  # Trip planning
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── api/                    # API routes
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── logout/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── locations/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── activities/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── events/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── reviews/
│   │   │   │   │   └── route.ts
│   │   │   │   └── search/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── _components/            # Page-specific components
│   │   │       ├── layout/
│   │   │       │   ├── Header.tsx
│   │   │       │   ├── Footer.tsx
│   │   │       │   └── Navigation.tsx
│   │   │       ├── home/
│   │   │       │   ├── Hero.tsx
│   │   │       │   ├── FeaturedLocations.tsx
│   │   │       │   └── ActivityCategories.tsx
│   │   │       └── locations/
│   │   │           ├── LocationCard.tsx
│   │   │           ├── LocationFilters.tsx
│   │   │           └── LocationMap.tsx
│   │   │
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── ui/                     # Basic UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── index.ts            # Export all components
│   │   │   │
│   │   │   ├── forms/                  # Form components
│   │   │   │   ├── SearchForm.tsx
│   │   │   │   ├── FilterForm.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   └── TripForm.tsx
│   │   │   │
│   │   │   ├── maps/                   # Map-related components
│   │   │   │   ├── InteractiveMap.tsx
│   │   │   │   ├── LocationMarker.tsx
│   │   │   │   ├── MapControls.tsx
│   │   │   │   └── MapPopup.tsx
│   │   │   │
│   │   │   ├── location/               # Location-specific components
│   │   │   │   ├── LocationCard.tsx
│   │   │   │   ├── LocationGrid.tsx
│   │   │   │   ├── LocationDetails.tsx
│   │   │   │   ├── LocationGallery.tsx
│   │   │   │   └── LocationReviews.tsx
│   │   │   │
│   │   │   ├── activity/               # Activity components
│   │   │   │   ├── ActivityCard.tsx
│   │   │   │   ├── ActivityList.tsx
│   │   │   │   ├── DifficultyBadge.tsx
│   │   │   │   └── EquipmentList.tsx
│   │   │   │
│   │   │   ├── event/                  # Event components
│   │   │   │   ├── EventCard.tsx
│   │   │   │   ├── EventCalendar.tsx
│   │   │   │   └── EventRegistration.tsx
│   │   │   │
│   │   │   ├── review/                 # Review components
│   │   │   │   ├── ReviewCard.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   ├── RatingStars.tsx
│   │   │   │   └── ReviewList.tsx
│   │   │   │
│   │   │   └── trip/                   # Trip planning components
│   │   │       ├── TripCard.tsx
│   │   │       ├── TripItinerary.tsx
│   │   │       ├── PackingList.tsx
│   │   │       └── TripCalendar.tsx
│   │   │
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useAuth.ts              # Authentication hook
│   │   │   ├── useLocation.ts          # Geolocation hook
│   │   │   ├── useSearch.ts            # Search functionality
│   │   │   ├── useFilters.ts           # Filter management
│   │   │   ├── useMap.ts               # Map interactions
│   │   │   ├── useBookmarks.ts         # Bookmark management
│   │   │   └── useWeather.ts           # Weather data
│   │   │
│   │   ├── lib/                        # Utility libraries
│   │   │   ├── api.ts                  # API client configuration
│   │   │   ├── auth.ts                 # Authentication utilities
│   │   │   ├── database.ts             # Database connection (if needed)
│   │   │   ├── validations.ts          # Form validation schemas
│   │   │   ├── constants.ts            # Application constants
│   │   │   ├── utils.ts                # General utilities
│   │   │   └── maps.ts                 # Map utilities
│   │   │
│   │   ├── types/                      # TypeScript type definitions
│   │   │   ├── auth.ts                 # Authentication types
│   │   │   ├── location.ts             # Location-related types
│   │   │   ├── activity.ts             # Activity types
│   │   │   ├── event.ts                # Event types
│   │   │   ├── review.ts               # Review types
│   │   │   ├── trip.ts                 # Trip types
│   │   │   ├── user.ts                 # User types
│   │   │   └── api.ts                  # API response types
│   │   │
│   │   ├── stores/                     # State management (Zustand)
│   │   │   ├── authStore.ts            # Authentication state
│   │   │   ├── searchStore.ts          # Search state
│   │   │   ├── filterStore.ts          # Filter state
│   │   │   ├── mapStore.ts             # Map state
│   │   │   └── bookmarkStore.ts        # Bookmark state
│   │   │
│   │   └── styles/                     # Styling files
│   │       ├── globals.css             # Global CSS
│   │       ├── components.css          # Component-specific styles
│   │       └── utilities.css           # Utility classes
│   │
│   └── tests/                          # Frontend tests
│       ├── __mocks__/                  # Test mocks
│       ├── components/                 # Component tests
│       ├── hooks/                      # Hook tests
│       ├── pages/                      # Page tests
│       └── utils/                      # Utility tests
│
├── backend/                            # Express.js Backend API
│   ├── package.json                    # Backend dependencies
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── .env.example                    # Backend environment variables
│   ├── nodemon.json                    # Development server configuration
│   │
│   ├── src/
│   │   ├── app.ts                      # Express app configuration
│   │   ├── server.ts                   # Server entry point
│   │   │
│   │   ├── controllers/                # Route controllers
│   │   │   ├── authController.ts       # Authentication endpoints
│   │   │   ├── locationController.ts   # Location CRUD operations
│   │   │   ├── activityController.ts   # Activity management
│   │   │   ├── eventController.ts      # Event management
│   │   │   ├── reviewController.ts     # Review operations
│   │   │   ├── userController.ts       # User management
│   │   │   ├── searchController.ts     # Search functionality
│   │   │   └── tripController.ts       # Trip planning
│   │   │
│   │   ├── middleware/                 # Custom middleware
│   │   │   ├── auth.ts                 # Authentication middleware
│   │   │   ├── validation.ts           # Request validation
│   │   │   ├── rateLimiting.ts         # Rate limiting
│   │   │   ├── cors.ts                 # CORS configuration
│   │   │   ├── errorHandler.ts         # Error handling
│   │   │   └── logger.ts               # Request logging
│   │   │
│   │   ├── models/                     # Database models
│   │   │   ├── User.ts                 # User model
│   │   │   ├── Location.ts             # Location model
│   │   │   ├── Activity.ts             # Activity model
│   │   │   ├── Event.ts                # Event model
│   │   │   ├── Review.ts               # Review model
│   │   │   ├── Trip.ts                 # Trip model
│   │   │   └── index.ts                # Export all models
│   │   │
│   │   ├── routes/                     # API routes
│   │   │   ├── auth.ts                 # Authentication routes
│   │   │   ├── locations.ts            # Location routes
│   │   │   ├── activities.ts           # Activity routes
│   │   │   ├── events.ts               # Event routes
│   │   │   ├── reviews.ts              # Review routes
│   │   │   ├── users.ts                # User routes
│   │   │   ├── search.ts               # Search routes
│   │   │   ├── trips.ts                # Trip routes
│   │   │   └── index.ts                # Route aggregation
│   │   │
│   │   ├── services/                   # Business logic
│   │   │   ├── authService.ts          # Authentication logic
│   │   │   ├── locationService.ts      # Location business logic
│   │   │   ├── activityService.ts      # Activity business logic
│   │   │   ├── eventService.ts         # Event business logic
│   │   │   ├── reviewService.ts        # Review business logic
│   │   │   ├── searchService.ts        # Search logic
│   │   │   ├── emailService.ts         # Email notifications
│   │   │   ├── imageService.ts         # Image processing
│   │   │   ├── weatherService.ts       # Weather API integration
│   │   │   └── mapService.ts           # Map services
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── database.ts             # Database connection
│   │   │   ├── validation.ts           # Validation helpers
│   │   │   ├── encryption.ts           # Password hashing
│   │   │   ├── jwt.ts                  # JWT token handling
│   │   │   ├── logger.ts               # Logging utilities
│   │   │   ├── constants.ts            # Application constants
│   │   │   └── helpers.ts              # General helpers
│   │   │
│   │   ├── types/                      # TypeScript types
│   │   │   ├── auth.ts                 # Authentication types
│   │   │   ├── location.ts             # Location types
│   │   │   ├── activity.ts             # Activity types
│   │   │   ├── event.ts                # Event types
│   │   │   ├── review.ts               # Review types
│   │   │   ├── user.ts                 # User types
│   │   │   ├── trip.ts                 # Trip types
│   │   │   └── api.ts                  # API types
│   │   │
│   │   └── config/                     # Configuration files
│   │       ├── database.ts             # Database configuration
│   │       ├── redis.ts                # Redis configuration
│   │       ├── email.ts                # Email configuration
│   │       └── external.ts             # External API configurations
│   │
│   ├── prisma/                         # Prisma ORM files
│   │   ├── schema.prisma               # Database schema
│   │   ├── migrations/                 # Database migrations
│   │   └── seed.ts                     # Database seeding
│   │
│   └── tests/                          # Backend tests
│       ├── unit/                       # Unit tests
│       ├── integration/                # Integration tests
│       ├── fixtures/                   # Test data
│       └── helpers/                    # Test utilities
│
├── shared/                             # Shared code between frontend and backend
│   ├── types/                          # Shared TypeScript types
│   │   ├── common.ts                   # Common types
│   │   ├── api.ts                      # API types
│   │   └── validation.ts               # Validation schemas
│   ├── constants/                      # Shared constants
│   │   ├── activities.ts               # Activity constants
│   │   ├── locations.ts                # Location constants
│   │   └── api.ts                      # API constants
│   └── utils/                          # Shared utilities
│       ├── validation.ts               # Validation functions
│       ├── formatting.ts               # Data formatting
│       └── calculations.ts             # Common calculations
│
├── docs/                               # Documentation
│   ├── api/                            # API documentation
│   │   ├── auth.md                     # Authentication API
│   │   ├── locations.md                # Locations API
│   │   ├── activities.md               # Activities API
│   │   ├── events.md                   # Events API
│   │   └── reviews.md                  # Reviews API
│   ├── deployment/                     # Deployment guides
│   │   ├── local.md                    # Local development
│   │   ├── production.md               # Production deployment
│   │   └── docker.md                   # Docker setup
│   ├── database/                       # Database documentation
│   │   ├── schema.md                   # Schema documentation
│   │   ├── migrations.md               # Migration guide
│   │   └── seeding.md                  # Data seeding
│   └── user-guide/                     # User documentation
│       ├── features.md                 # Feature documentation
│       └── troubleshooting.md          # Common issues
│
├── scripts/                            # Utility scripts
│   ├── setup.sh                        # Initial setup script
│   ├── seed-db.sh                      # Database seeding
│   ├── deploy.sh                       # Deployment script
│   └── backup.sh                       # Database backup
│
├── .github/                            # GitHub workflows
│   ├── workflows/
│   │   ├── ci.yml                      # Continuous integration
│   │   ├── deploy.yml                  # Deployment workflow
│   │   └── test.yml                    # Testing workflow
│   └── ISSUE_TEMPLATE/                 # Issue templates
│
├── docker/                             # Docker configurations
│   ├── frontend.Dockerfile             # Frontend Docker image
│   ├── backend.Dockerfile              # Backend Docker image
│   └── nginx.conf                      # Nginx configuration
│
└── database-schema.sql                 # Database schema file
```

##Quick Start Commands

```bash
# Clone and setup
git clone <repository-url>
cd outdoor-spot
npm run setup

# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database

# Testing
npm run test             # Run all tests
npm run test:frontend    # Frontend tests only
npm run test:backend     # Backend tests only

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Deployment
npm run deploy           # Deploy to production
```

##Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Implement frontend components
   - Add backend API endpoints
   - Write tests for new functionality
   - Update documentation

2. **Code Review Process**
   - Submit pull request
   - Automated testing runs
   - Code review by team members
   - Merge to main branch

3. **Deployment**
   - Automatic deployment on main branch merge
   - Database migrations run automatically
   - Health checks verify deployment

## Environment Configuration

### Required Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/outdoor_spot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
WEATHER_API_KEY=your_weather_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_SERVICE_API_KEY=your_email_service_key
```


