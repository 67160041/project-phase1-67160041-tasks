USE tasks_db;

-- เคลียร์ข้อมูลเก่าออกก่อน (ถ้ามี)
DELETE FROM tasks;
DELETE FROM categories;
DELETE FROM users;

-- Reset ตัวนับ AUTO_INCREMENT
ALTER TABLE tasks AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- 1. เพิ่มข้อมูลตัวอย่างตาราง users 3 ระเบียน
INSERT INTO users (name, email) VALUES
('Susie Sasu', 'susie@example.com'),
('Nut Zero', 'nut@example.com'),
('Prae Yelu', 'prae@example.com');

-- 2. เพิ่มข้อมูลตัวอย่างตาราง categories 3 ระเบียน
INSERT INTO categories (name) VALUES
('Project'),
('Assignment'),
('Study');

-- 3. เพิ่มข้อมูลตัวอย่างตาราง tasks 3 ระเบียน
INSERT INTO tasks (title, dueDate, status, user_id, category_id) VALUES
('3D Model', '2026-09-01', 'In Progress', 1, 1),
('API for Back-End.', '2026-08-25', 'Pending', 2, 2),
('Business Process', '2026-08-28', 'To Do', 3, 3);