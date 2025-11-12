# CMU ShareCycle - Frontend

เว็บแอปพลิเคชันสำหรับแลกเปลี่ยนสินค้าระหว่างนักศึกษามหาวิทยาลัยเชียงใหม่

## การติดตั้ง

1. ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง):
```bash
npm install
```

## การรันแอปพลิเคชัน

### Development Mode
```bash
npm run dev
```

แอปพลิเคชันจะรันที่ `http://localhost:5173` (หรือพอร์ตอื่นที่ Vite แสดง)

### Build for Production
```bash
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `dist/`

### Preview Production Build
```bash
npm run preview
```

## โครงสร้างโปรเจกต์

```
src/
├── components/        # React components
│   ├── layout/       # Header, Footer
│   ├── modals/       # Modal components
│   └── ui/           # UI components (Button, Input, etc.)
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   └── ProfilePage.tsx
├── data/             # Mock data
│   └── mockData.ts
├── types.ts          # TypeScript types
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## ฟีเจอร์หลัก

- 🔐 หน้า Login (ภาษาไทย)
- 🏠 หน้า Home - ดูสินค้า, ค้นหา, กรอง
- 👤 หน้า Profile - ข้อมูลผู้ใช้, ประวัติการแลกเปลี่ยน
- 📝 Modal สำหรับโพสต์สินค้า
- 💬 Modal สำหรับขอแลกเปลี่ยน
- 🔔 Modal สำหรับการแจ้งเตือน

## เทคโนโลยีที่ใช้

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React (Icons)

## วิธีการใช้งาน

1. รัน `npm run dev`
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
3. หน้าแรกจะแสดงรายการสินค้าที่สามารถแลกเปลี่ยนได้
4. คลิกที่ "เข้าสู่ระบบ" เพื่อไปหน้า Login
5. คลิกที่ "Post Item" เพื่อโพสต์สินค้า
6. คลิกที่ "แลกเปลี่ยน" เพื่อขอแลกเปลี่ยนสินค้า
7. คลิกที่ไอคอน鈴เพื่อดูการแจ้งเตือน
