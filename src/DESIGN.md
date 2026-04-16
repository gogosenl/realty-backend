# DESIGN.md

## Architecture Overview

This project follows a modular monolith architecture using NestJS for the backend and Nuxt 3 for the frontend.

## Backend Architecture

### Module Structure
- `AgentsModule` — CRUD operations for real estate agents
- `TransactionsModule` — Transaction lifecycle management and commission calculation

### Data Models

**Agent**
- name, email, phone
- timestamps

**Transaction**
- propertyAddress, salePrice, totalServiceFee
- stage: agreement | earnest_money | title_deed | completed
- listingAgent (ref: Agent)
- sellingAgent (ref: Agent)
- commissionBreakdown (embedded object)

### Commission Breakdown Storage
Commission breakdown is computed and embedded directly in the transaction document when the stage transitions to `completed`. This avoids an extra collection and keeps financial data co-located with the transaction.

### Stage Transitions
Transitions are strictly sequential: agreement → earnest_money → title_deed → completed. Invalid transitions (skipping stages, going backwards) throw a `BadRequestException`. This ensures data integrity and traceability.

### Commission Rules
- Agency always receives 50% of totalServiceFee
- If listingAgent === sellingAgent: that agent receives the full 50% agent pool
- If listingAgent !== sellingAgent: each receives 25%

## Frontend Architecture

### Pages
- `/` — Dashboard with stage summary cards and transaction list
- `/transactions/new` — Create new transaction form
- `/transactions/[id]` — Transaction detail with stage progression and commission breakdown

### State Management (Pinia)
- `useAgentsStore` — agents list, fetch, create
- `useTransactionsStore` — transactions list, current transaction, stage updates

### API Communication
All API calls use Nuxt's `$fetch` utility with the base URL configured via `NUXT_PUBLIC_API_BASE` environment variable.