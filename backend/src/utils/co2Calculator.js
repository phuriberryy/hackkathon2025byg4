// CO₂ Footprint Calculator
// คำนวณค่า CO₂ footprint ของแต่ละ item ตาม category และ condition

// ค่า CO₂ footprint ต่อ category (kg CO₂e ต่อ 1 item)
// ข้อมูลจากแหล่งอ้างอิง: Life Cycle Assessment (LCA) studies
const CO2_BY_CATEGORY = {
  'Clothes & Fashion': 8.0, // เสื้อผ้า, กางเกง, รองเท้า
  'Dorm Essentials': 10.0, // หม้อหุงข้าว, ราวตากผ้า, ผ้าห่ม
  'Books & Study': 20.0, // ตำราเรียน, สมุด, ไฟอ่านหนังสือ
  'Kitchen & Appliances': 15.0, // กระทะ, เขียง, หม้อทอด
  'Cleaning & Laundry': 6.0, // น้ำยาซักผ้า, ไม้ถูพื้น, ไม้กวาด
  'Hobbies & Entertainment': 10.0, // บอร์ดเกม, กีตาร์, ของสะสม
  'Sports Gear': 10.0, // รองเท้ากีฬา, ลูกบอล, เสื่อโยคะ
  'Others': 5.0, // อื่น ๆ
}

// Multiplier ตาม condition
// Item ที่ condition ดีกว่ามี CO₂ footprint สูงกว่าเพราะใกล้เคียงการผลิตใหม่
// แต่เมื่อแลกเปลี่ยนกัน จะช่วยลด CO₂ เพราะไม่ต้องผลิตใหม่
const CONDITION_MULTIPLIER = {
  'Like New': 0.9, // 90% ของ CO₂ footprint (ยังคงคุณค่าสูง)
  'Good': 0.7, // 70% ของ CO₂ footprint (ใช้งานได้ดี)
  'Fair': 0.5, // 50% ของ CO₂ footprint (ใช้งานได้แต่มีสภาพไม่ดี)
}

/**
 * คำนวณ CO₂ footprint ของ item
 * @param {string} category - Category ของ item
 * @param {string} condition - Condition ของ item (Like New, Good, Fair)
 * @returns {number} CO₂ footprint ในหน่วย kg CO₂e
 */
export function calculateItemCO2(category, condition) {
  // ดึงค่า CO₂ footprint ตาม category
  const baseCO2 = CO2_BY_CATEGORY[category] || CO2_BY_CATEGORY['Others']
  
  // คำนวณตาม condition
  const multiplier = CONDITION_MULTIPLIER[condition] || CONDITION_MULTIPLIER['Good']
  
  return baseCO2 * multiplier
}

/**
 * คำนวณ CO₂ ที่ลดได้จากการแลกเปลี่ยน
 * เมื่อแลกเปลี่ยนกัน จะช่วยลด CO₂ เพราะ:
 * 1. ไม่ต้องผลิตใหม่ (avoided production)
 * 2. ลดขยะ (waste reduction)
 * 3. เพิ่มอายุการใช้งาน (extended life)
 * 
 * สูตร: CO₂ reduced = (CO₂ footprint ของ item 1 + CO₂ footprint ของ item 2) / 2
 * หรือใช้ค่าสูงสุด: CO₂ reduced = max(CO₂ footprint ของ item 1, CO₂ footprint ของ item 2)
 * 
 * @param {number} co2Item1 - CO₂ footprint ของ item แรก
 * @param {number} co2Item2 - CO₂ footprint ของ item ที่สอง
 * @returns {number} CO₂ ที่ลดได้ในหน่วย kg CO₂e
 */
export function calculateExchangeCO2Reduction(co2Item1, co2Item2) {
  // ใช้ค่าเฉลี่ยของ CO₂ footprint ของทั้งสอง items
  // เพราะการแลกเปลี่ยนช่วยลด CO₂ ทั้งสองฝ่าย
  const averageCO2 = (co2Item1 + co2Item2) / 2
  
  // คำนวณ CO₂ ที่ลดได้จากการแลกเปลี่ยน
  // โดยประมาณว่าแต่ละ item จะช่วยลด CO₂ ได้ 70-80% ของค่า footprint
  // (เพราะการแลกเปลี่ยนช่วยหลีกเลี่ยงการผลิตใหม่)
  const reductionFactor = 0.75 // 75% reduction
  
  return averageCO2 * reductionFactor
}

/**
 * คำนวณ CO₂ footprint ของ item และ CO₂ ที่ลดได้จากการแลกเปลี่ยน
 * @param {object} item1 - Item แรก (ต้องมี category และ item_condition)
 * @param {object} item2 - Item ที่สอง (ต้องมี category และ item_condition)
 * @returns {object} { co2Item1, co2Item2, co2Reduced }
 */
export function calculateExchangeCO2(item1, item2) {
  const co2Item1 = calculateItemCO2(item1.category, item1.item_condition)
  const co2Item2 = calculateItemCO2(item2.category, item2.item_condition)
  const co2Reduced = calculateExchangeCO2Reduction(co2Item1, co2Item2)
  
  return {
    co2Item1: parseFloat(co2Item1.toFixed(2)),
    co2Item2: parseFloat(co2Item2.toFixed(2)),
    co2Reduced: parseFloat(co2Reduced.toFixed(2)),
  }
}

/**
 * ดึงค่า CO₂ footprint ตาม category (สำหรับแสดงใน frontend)
 * @param {string} category - Category ของ item
 * @returns {number} CO₂ footprint ในหน่วย kg CO₂e
 */
export function getCO2ByCategory(category) {
  return CO2_BY_CATEGORY[category] || CO2_BY_CATEGORY['Others']
}

/**
 * ดึงค่า CO₂ footprint ทั้งหมด (สำหรับแสดงใน frontend)
 * @returns {object} Object ที่มี category และ CO₂ footprint
 */
export function getAllCO2Footprints() {
  return CO2_BY_CATEGORY
}

