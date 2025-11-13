// CO₂ Footprint Calculator (Frontend)
// คำนวณค่า CO₂ footprint ของแต่ละ item ตาม category และ condition
// ต้องตรงกับ backend/src/utils/co2Calculator.js

// ค่า CO₂ footprint ต่อ category (kg CO₂e ต่อ 1 item)
const CO2_BY_CATEGORY = {
  'Books & Textbooks': 2.5,
  'Clothes': 15.0,
  'Electronics': 45.0,
  'Dorm Items': 8.0,
  'Sports Equipment': 12.0,
  'Eco Items': 3.0,
  'Other': 5.0,
}

// Multiplier ตาม condition
const CONDITION_MULTIPLIER = {
  'Like New': 0.9,
  'Good': 0.7,
  'Fair': 0.5,
}

/**
 * คำนวณ CO₂ footprint ของ item
 * @param {string} category - Category ของ item
 * @param {string} condition - Condition ของ item (Like New, Good, Fair)
 * @returns {number} CO₂ footprint ในหน่วย kg CO₂e
 */
export function calculateItemCO2(category, condition) {
  const baseCO2 = CO2_BY_CATEGORY[category] || CO2_BY_CATEGORY['Other']
  const multiplier = CONDITION_MULTIPLIER[condition] || CONDITION_MULTIPLIER['Good']
  return baseCO2 * multiplier
}

/**
 * คำนวณ CO₂ ที่ลดได้จากการแลกเปลี่ยน
 * @param {number} co2Item1 - CO₂ footprint ของ item แรก
 * @param {number} co2Item2 - CO₂ footprint ของ item ที่สอง (optional)
 * @returns {number} CO₂ ที่ลดได้ในหน่วย kg CO₂e
 */
export function calculateExchangeCO2Reduction(co2Item1, co2Item2 = null) {
  if (co2Item2 === null) {
    // ถ้ามีแค่ item เดียว ให้คำนวณจาก item นั้น โดยประมาณว่า
    // การแลกเปลี่ยนช่วยลด CO₂ ได้ 75% ของค่า footprint
    return co2Item1 * 0.75
  }
  
  // ถ้ามีทั้งสอง items ให้คำนวณจากค่าเฉลี่ย
  const averageCO2 = (co2Item1 + co2Item2) / 2
  const reductionFactor = 0.75 // 75% reduction
  return averageCO2 * reductionFactor
}

/**
 * ดึงค่า CO₂ footprint ตาม category
 * @param {string} category - Category ของ item
 * @returns {number} CO₂ footprint ในหน่วย kg CO₂e
 */
export function getCO2ByCategory(category) {
  return CO2_BY_CATEGORY[category] || CO2_BY_CATEGORY['Other']
}

/**
 * ดึงค่า CO₂ footprint ทั้งหมด
 * @returns {object} Object ที่มี category และ CO₂ footprint
 */
export function getAllCO2Footprints() {
  return CO2_BY_CATEGORY
}





