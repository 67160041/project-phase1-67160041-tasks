-- สร้าง Database
CREATE DATABASE IF NOT EXISTS tasks_db;
USE tasks_db;

-- ลบตารางเดิมถ้ามีอยู่แล้ว (เรียงจาก Child ไป Parent เพื่อหลีกเลี่ยง Foreign Key Error)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. ตาราง users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- 2. ตาราง categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 3. ตาราง tasks
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    dueDate DATE,
    status ENUM('Pending', 'In Progress', 'To Do') DEFAULT 'To Do',
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);