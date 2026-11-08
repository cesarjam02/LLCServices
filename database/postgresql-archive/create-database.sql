-- Ejecuta este archivo conectado como el superusuario "postgres".
-- Credenciales que utilizará la aplicación:
--   Base: lily | Usuario: lily_app | Contraseña: LilyDb2026!ChangeMe

SELECT 'CREATE ROLE lily_app LOGIN PASSWORD ''LilyDb2026!ChangeMe'''
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lily_app')\gexec

ALTER ROLE lily_app WITH LOGIN PASSWORD 'LilyDb2026!ChangeMe';

SELECT 'CREATE DATABASE lily OWNER lily_app ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lily')\gexec

\connect lily

ALTER DATABASE lily OWNER TO lily_app;
GRANT ALL PRIVILEGES ON DATABASE lily TO lily_app;
GRANT ALL ON SCHEMA public TO lily_app;
ALTER SCHEMA public OWNER TO lily_app;

\echo 'Base de datos lily y usuario lily_app creados correctamente.'
