#!/bin/bash

# CMU ShareCycle - Start Frontend Only
# สคริปต์สำหรับรัน frontend เท่านั้น

echo "🟢 กำลังเริ่ม Frontend..."
echo ""

# ตรวจสอบว่า frontend/.env มีอยู่หรือไม่
if [ ! -f "frontend/.env" ]; then
    echo "⚠️  ไม่พบไฟล์ frontend/.env"
    echo "📝 กำลังสร้างไฟล์ frontend/.env..."
    echo "REACT_APP_API_URL=http://localhost:4000/api" > frontend/.env
    echo "✅ สร้างไฟล์ frontend/.env สำเร็จ"
    echo ""
fi

# ตรวจสอบว่า dependencies ติดตั้งแล้วหรือยัง
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 กำลังติดตั้ง dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# รัน Frontend
echo "🚀 กำลังรัน Frontend ที่ http://localhost:3000"
echo "⏹️  กด Ctrl+C เพื่อหยุด"
echo ""

cd frontend
npm start











