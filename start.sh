#!/bin/bash

# CMU ShareCycle - Start Script
# สคริปต์สำหรับรันทั้ง backend และ frontend

echo "🚀 กำลังเริ่มต้น CMU ShareCycle..."
echo ""

# ตรวจสอบว่ามี .env files หรือไม่
if [ ! -f "backend/.env" ]; then
    echo "⚠️  ไม่พบไฟล์ backend/.env"
    echo "📝 กำลังสร้างไฟล์ backend/.env..."
    cat > backend/.env << EOF
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sharecycle
JWT_SECRET=cmu-sharecycle-secret-key-2025-min-16-chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@cmu.ac.th
EMAIL_PASS=test-password
EMAIL_FROM=CMU ShareCycle <test@cmu.ac.th>
EOF
    echo "✅ สร้างไฟล์ backend/.env สำเร็จ"
    echo "⚠️  กรุณาแก้ไข DATABASE_URL และ EMAIL settings ใน backend/.env"
    echo ""
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  ไม่พบไฟล์ frontend/.env"
    echo "📝 กำลังสร้างไฟล์ frontend/.env..."
    echo "REACT_APP_API_URL=http://localhost:4000/api" > frontend/.env
    echo "✅ สร้างไฟล์ frontend/.env สำเร็จ"
    echo ""
fi

# ตรวจสอบว่า dependencies ติดตั้งแล้วหรือยัง
if [ ! -d "backend/node_modules" ]; then
    echo "📦 กำลังติดตั้ง backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ ติดตั้ง backend dependencies สำเร็จ"
    echo ""
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 กำลังติดตั้ง frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ ติดตั้ง frontend dependencies สำเร็จ"
    echo ""
fi

# ตรวจสอบว่า port ว่างหรือไม่
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 4000 ถูกใช้งานอยู่แล้ว (Backend อาจกำลังรันอยู่)"
else
    echo "✅ Port 4000 ว่างอยู่"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 ถูกใช้งานอยู่แล้ว (Frontend อาจกำลังรันอยู่)"
else
    echo "✅ Port 3000 ว่างอยู่"
fi

echo ""
echo "🔧 กำลังรัน Backend และ Frontend..."
echo ""

# ฟังก์ชันสำหรับ cleanup เมื่อ exit
cleanup() {
    echo ""
    echo "🛑 กำลังหยุดการทำงาน..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# รัน Backend
echo "🔵 กำลังเริ่ม Backend (port 4000)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# รอให้ backend เริ่มต้น
sleep 3

# รัน Frontend
echo "🟢 กำลังเริ่ม Frontend (port 3000)..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ เริ่มต้นสำเร็จ!"
echo ""
echo "📊 สถานะ:"
echo "   Backend:  http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "⏹️  กด Ctrl+C เพื่อหยุดการทำงาน"
echo ""

# รอให้ process รันอยู่
wait











