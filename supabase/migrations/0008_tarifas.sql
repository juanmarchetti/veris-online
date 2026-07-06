-- supabase/migrations/0008_tarifas.sql

ALTER TABLE especialidades
ADD COLUMN precio_base numeric(10,2) DEFAULT 25.00 NOT NULL;
