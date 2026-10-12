require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("js-yaml");

const db = require("./db"); // เรียกใช้ connection pool จาก db.js
const { fetchQuoteWithResilience } = require("./services/external-api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------------- Swagger UI Setup (ส่วนที่ 1: Docs/DX) ----------------
try {
  // อ่านไฟล์ openapi.yaml ที่อยู่ root directory
  const openapiPath = path.join(__dirname, "../openapi.yaml");
  if (fs.existsSync(openapiPath)) {
    const openapiDocument = YAML.load(fs.readFileSync(openapiPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
    console.log("เอกสาร Swagger UI พร้อมใช้งานที่ /api-docs");
  } else {
    console.warn("คำเตือน: ไม่พบไฟล์ openapi.yaml ที่โฟลเดอร์ root");
  }
} catch (error) {
  console.error("เกิดข้อผิดพลาดในการโหลดไฟล์ openapi.yaml:", error.message);
}

// ---------------- Route เริ่มต้น ----------------
app.get("/", (req, res) => {
  res.status(200).json({ message: "Tasks API พร้อมใช้งาน" });
});

// 1. GET: ดึงรายการงานทั้งหมดจาก Database
app.get("/api/v1/tasks", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id, 
        t.title, 
        t.dueDate, 
        t.status, 
        u.name AS user_name, 
        c.name AS category_name
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
    `);
    res.status(200).json({ message: "สำเร็จ", data: rows });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      error: error.message,
    });
  }
});

// 2. GET: ดึงข้อมูลงานรายรายการ
app.get("/api/v1/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `
      SELECT 
        t.id, 
        t.title, 
        t.dueDate, 
        t.status, 
        u.name AS user_name, 
        c.name AS category_name
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลงานที่ต้องการ" });
    }

    res.status(200).json({ message: "สำเร็จ", data: rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      error: error.message,
    });
  }
});

// 3. POST: เพิ่มข้อมูลงานใหม่ลง Database
app.post("/api/v1/tasks", async (req, res) => {
  try {
    const { title, dueDate, status, user_id, category_id } = req.body;

    if (!title || !dueDate || !status || !user_id || !category_id) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [result] = await db.query(
      "INSERT INTO tasks (title, dueDate, status, user_id, category_id) VALUES (?, ?, ?, ?, ?)",
      [title, dueDate, status, user_id, category_id],
    );

    res.status(201).json({
      message: "เพิ่มข้อมูลสำเร็จ",
      data: {
        id: result.insertId,
        title,
        dueDate,
        status,
        user_id,
        category_id,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
      error: error.message,
    });
  }
});

// 4. PUT: แก้ไขข้อมูลงานใน Database
app.put("/api/v1/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, dueDate, status } = req.body;

    if (!title || !dueDate || !status) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [result] = await db.query(
      "UPDATE tasks SET title = ?, dueDate = ?, status = ? WHERE id = ?",
      [title, dueDate, status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลงานที่ต้องการแก้ไข" });
    }

    res.status(200).json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
      error: error.message,
    });
  }
});

// 5. DELETE: ลบข้อมูลงานใน Database
app.delete("/api/v1/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM tasks WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลงานที่ต้องการลบ" });
    }

    res.status(200).json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
      error: error.message,
    });
  }
});

// 6. GET: Endpoint เชื่อมต่อ External API พร้อม Retry/Timeout/Fallback (ส่วนที่ 2: Integration)
app.get("/api/v1/tasks/external/quote", async (req, res) => {
  try {
    const result = await fetchQuoteWithResilience();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "ระบบไม่สามารถดึงข้อมูลคำคมได้",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
  console.log(`เอกสาร API (Swagger UI): http://localhost:${PORT}/api-docs`);
});
