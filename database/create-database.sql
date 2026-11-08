-- Solo para desarrollo local con XAMPP. En Hostinger crea la base y el usuario en hPanel.
-- No modifica bases ni usuarios existentes.
CREATE DATABASE IF NOT EXISTS lily_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lily_app'@'localhost' IDENTIFIED BY 'LilyDb2026!ChangeMe';
GRANT ALL PRIVILEGES ON lily_mysql.* TO 'lily_app'@'localhost';
