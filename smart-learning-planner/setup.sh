#!/bin/bash
echo "🧠 Setting up Smart Learning Planner..."

echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. cd backend && cp .env.example .env"
echo "  2. Edit backend/.env with your MongoDB URI"
echo "  3. Terminal 1: cd backend && npm run dev"
echo "  4. Terminal 2: cd frontend && npm start"
echo "  5. Open http://localhost:3000"
