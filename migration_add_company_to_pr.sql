-- Migration: Add 'company' column to 'purchase_requisitions' table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add the column if it doesn't exist yet
ALTER TABLE public.purchase_requisitions
ADD COLUMN IF NOT EXISTS company text;

-- Step 2: Backfill existing rows yang belum ada company-nya
-- Ambil nama company pertama dari tabel master companies sebagai default
UPDATE public.purchase_requisitions
SET company = (
    SELECT name FROM public.companies ORDER BY name ASC LIMIT 1
)
WHERE company IS NULL OR company = '';

-- Step 3: Verifikasi hasil
SELECT id, requester_fullname, department, company, request_date
FROM public.purchase_requisitions
ORDER BY id DESC
LIMIT 20;

