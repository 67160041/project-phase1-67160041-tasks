# บันทึกผลการทดสอบ Failure Scenario (External API Integration)

## 1. ข้อมูลการตั้งค่าระบบความทนทาน (Resilience Configuration)

- **บริการภายนอกที่เชื่อมต่อ**: `https://dummyjson.com/quotes/random`
- **Timeout ที่กำหนด**: 2500 ms (2.5 วินาที)
- **Retry Logic**: สูงสุด 2 ครั้ง (รวมเรียกครั้งแรกเป็น 3 ครั้ง)
- **กลไก Delay**: Fixed/Linear Delay (attempt \* 500 ms)
- **กลไก Fallback**: ส่งข้อมูลคำคมเริ่มต้นของระบบเมื่อการเรียกภายนอกล้มเหลวสมบูรณ์

---

## 2. สถานการณ์ที่ 1: การจำลองข้อผิดพลาดจาก Network (URL ไม่ถูกต้อง / ปิดเน็ต)

- **การจำลอง**: เปลี่ยนปลายทางใน `src/services/external-api.js` เป็น URL ที่ไม่มีอยู่จริง
- **พฤติกรรมของระบบ**:
  1. ยิงครั้งที่ 1 ล้มเหลว -> รอดักจับ Error
  2. หน่วงเวลา 500ms -> Retry ครั้งที่ 1 ล้มเหลว
  3. หน่วงเวลา 1000ms -> Retry ครั้งที่ 2 ล้มเหลว
  4. ทำงานเข้าสู่ Fallback ส่งคืนข้อความเริ่มต้นโดยเซิร์ฟเวอร์ไม่ Crash หรือค้าง
- **Response ที่ได้รับ**: Status `200 OK`
  ```json
  {
    "success": false,
    "source": "fallback",
    "message": "ไม่สามารถเชื่อมต่อบริการภายนอกได้ ระบบใช้ข้อมูลสำรองเริ่มต้น",
    "data": {
      "id": 0,
      "quote": "Do what you can, with what you have, where you are.",
      "author": "System Default"
    }
  }
  ```
