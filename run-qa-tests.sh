#!/bin/bash

# CampusIQ QA Testing Script
# This script helps set up and run QA tests

set -e

echo "🚀 CampusIQ QA Testing Setup"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the CampusIQ directory.${NC}"
    exit 1
fi

# Clear previous debug logs
echo -e "${YELLOW}📝 Clearing previous debug logs...${NC}"
rm -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
echo -e "${GREEN}✅ Debug logs cleared${NC}"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found.${NC}"
    echo "   Please create a .env file with required variables:"
    echo "   - GEMINI_API_KEY (or OPENAI_API_KEY)"
    echo "   - AI_PROVIDER (gemini|openai|mock)"
    echo "   - FCM_SERVER_KEY"
    echo ""
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Check Firebase configuration
echo -e "${YELLOW}🔍 Checking Firebase configuration...${NC}"
if [ -f "android/app/google-services.json" ]; then
    echo -e "${GREEN}✅ Android Firebase config found${NC}"
else
    echo -e "${RED}❌ Android Firebase config missing (android/app/google-services.json)${NC}"
fi

if [ -f "ios/CRM/GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✅ iOS Firebase config found${NC}"
else
    echo -e "${RED}❌ iOS Firebase config missing (ios/CRM/GoogleService-Info.plist)${NC}"
fi
echo ""

# Check device connection
echo -e "${YELLOW}📱 Checking device connection...${NC}"
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
    if [ "$DEVICES" -gt 0 ]; then
        echo -e "${GREEN}✅ Android device(s) connected:${NC}"
        adb devices | grep "device"
    else
        echo -e "${YELLOW}⚠️  No Android devices connected${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  adb not found. Android testing may not work.${NC}"
fi
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# iOS pod install check
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "ios" ]; then
        echo -e "${YELLOW}🍎 Checking iOS dependencies...${NC}"
        if [ ! -d "ios/Pods" ]; then
            echo -e "${YELLOW}📦 Installing iOS pods...${NC}"
            cd ios && pod install && cd ..
            echo -e "${GREEN}✅ iOS pods installed${NC}"
        else
            echo -e "${GREEN}✅ iOS pods already installed${NC}"
        fi
        echo ""
    fi
fi

# Ask user what they want to do
echo -e "${GREEN}What would you like to do?${NC}"
echo "1. Start Metro bundler on port 8082"
echo "2. Run Android build"
echo "3. Run iOS build (Mac only)"
echo "4. Monitor debug logs"
echo "5. All of the above (recommended)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting Metro bundler on port 8082...${NC}"
        npx react-native start --port 8082
        ;;
    2)
        echo -e "${GREEN}🤖 Building and running Android app...${NC}"
        echo -e "${YELLOW}   Make sure Metro is running in another terminal!${NC}"
        sleep 2
        adb reverse tcp:8082 tcp:8082 2>/dev/null || true
        npx react-native run-android --port 8082
        ;;
    3)
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo -e "${RED}❌ iOS build only works on macOS${NC}"
            exit 1
        fi
        echo -e "${GREEN}🍎 Building and running iOS app...${NC}"
        echo -e "${YELLOW}   Make sure Metro is running in another terminal!${NC}"
        sleep 2
        npx react-native run-ios
        ;;
    4)
        echo -e "${GREEN}📊 Monitoring debug logs...${NC}"
        echo -e "${YELLOW}   Press Ctrl+C to stop${NC}"
        tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
        ;;
    5)
        echo -e "${GREEN}🚀 Starting full QA test setup...${NC}"
        echo ""
        echo -e "${YELLOW}Step 1: Starting Metro bundler in background...${NC}"
        npx react-native start --port 8082 &
        METRO_PID=$!
        echo -e "${GREEN}✅ Metro started (PID: $METRO_PID)${NC}"
        echo ""
        
        sleep 3
        
        echo -e "${YELLOW}Step 2: Setting up port forwarding...${NC}"
        adb reverse tcp:8082 tcp:8082 2>/dev/null || true
        echo -e "${GREEN}✅ Port forwarding configured${NC}"
        echo ""
        
        echo -e "${YELLOW}Step 3: Opening log monitor in new terminal...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log\""
        fi
        echo ""
        
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Metro bundler is running (PID: $METRO_PID)"
        echo "2. Log monitor should be open in a new terminal"
        echo "3. Run: npx react-native run-android --port 8082"
        echo "   OR: npx react-native run-ios"
        echo ""
        echo -e "${YELLOW}To stop Metro, run: kill $METRO_PID${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ QA testing setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Follow the QA_TESTING_GUIDE.md checklist"
echo "2. Monitor debug.log for issues:"
echo "   tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log"
echo "3. Report any issues with logs and screenshots"
echo ""

