#!/bin/bash

echo "🎨 Installing dependencies for News Page Redesign..."
echo ""

# Check if we're in the Frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Frontend directory."
    exit 1
fi

echo "📦 Installing framer-motion and sonner..."
npm install framer-motion sonner

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Review IMPLEMENTATION_GUIDE.md for complete redesign instructions"
    echo "   2. Review REDESIGN_INSTRUCTIONS.md for running the application"
    echo "   3. The design system (fonts + CSS variables) is already applied in src/index.css"
    echo "   4. NewsContext is created in src/context/NewsContext.jsx"
    echo ""
    echo "🚀 You can now start the development server:"
    echo "   npm run dev"
else
    echo ""
    echo "❌ Installation failed. Please install dependencies manually:"
    echo "   npm install framer-motion sonner"
fi
