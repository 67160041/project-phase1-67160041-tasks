const axios = require("axios");

/**
 * เรียก External API พร้อมกลไก Retry, Timeout และ Fallback
 */
async function fetchQuoteWithResilience() {
  const EXTERNAL_URL =
    process.env.EXTERNAL_API_URL || "https://dummyjson.com/quotes/random";
  const MAX_RETRIES = 2; // Retry 2 ครั้งตามเกณฑ์ (รวมครั้งแรกเป็น 3 ครั้ง)
  const TIMEOUT_MS = 2500; // กำหนดเวลา Timeout 2.5 วินาที
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      attempt++;
      const response = await axios.get(EXTERNAL_URL, {
        timeout: TIMEOUT_MS,
      });

      return {
        success: true,
        source: "external_api",
        data: response.data,
      };
    } catch (error) {
      console.warn(
        `[External API] ความพยายามครั้งที่ ${attempt} ล้มเหลว: ${error.message}`,
      );

      // หากพยายามครบจำนวนครั้งแล้ว ให้ออกจากลูปเพื่อเข้า Fallback
      if (attempt > MAX_RETRIES) {
        break;
      }

      // หน่วงเวลาก่อนลองใหม่ (Fixed / Backoff Delay)
      const delay = attempt * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Fallback: ส่งข้อมูลสำรองกลับเมื่อ API ภายนอกล้มเหลวสมบูรณ์
  return {
    success: false,
    source: "fallback",
    message: "ไม่สามารถเชื่อมต่อบริการภายนอกได้ ระบบใช้ข้อมูลสำรองเริ่มต้น",
    data: {
      id: 0,
      quote: "Do what you can, with what you have, where you are.",
      author: "System Default",
    },
  };
}

module.exports = {
  fetchQuoteWithResilience,
};
