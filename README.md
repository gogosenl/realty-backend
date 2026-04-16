# Realty Backend

NestJS + MongoDB Atlas backend for real estate transaction management.

## Live API
https://realty-backend-production-9037.up.railway.app

## Tech Stack
- Node.js (LTS)
- TypeScript
- NestJS
- MongoDB Atlas + Mongoose

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3001
```

## Running

```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Testing

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /agents | Create agent |
| GET | /agents | List agents |
| GET | /agents/:id | Get agent |
| POST | /transactions | Create transaction |
| GET | /transactions | List transactions |
| GET | /transactions/:id | Get transaction |
| PATCH | /transactions/:id/stage | Update stage |

## Commission Rules

- Agency: 50% of total service fee
- Same listing/selling agent: agent receives full 50%
- Different agents: each receives 25%