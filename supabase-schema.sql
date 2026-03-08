-- Create tables for the Halal Catering Entry System

-- 1. Tables Table
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 6,
    occupied_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone
CREATE POLICY "Allow public read access to tables" ON public.tables
    FOR SELECT TO public USING (true);

-- Allow all access to service/admin
CREATE POLICY "Allow full access to service role for tables" ON public.tables
    FOR ALL TO service_role USING (true);
    
-- Allow anon full access for easy development (REMOVE IN PROD)
CREATE POLICY "Allow anon all tables" ON public.tables
    FOR ALL TO anon USING (true);


-- 2. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    guest_count INTEGER NOT NULL,
    guest_names JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT NOT NULL,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    qr_token UUID,
    table_number INTEGER REFERENCES public.tables(table_number),
    entered_count INTEGER NOT NULL DEFAULT 0,
    reservation_date DATE, -- Ramadan night the guest selected (e.g. '2026-03-08' = Ramadan 19)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (public registration form)
CREATE POLICY "Allow anon insert registrations" ON public.registrations
    FOR INSERT TO anon WITH CHECK (true);

-- Allow anon read access (for easy frontend dashboard demo, REPLACE WITH PROPER AUTH IN PROD)
CREATE POLICY "Allow anon select registrations" ON public.registrations
    FOR SELECT TO anon USING (true);
    
-- Allow anon update access (for simple admin demo)
CREATE POLICY "Allow anon update registrations" ON public.registrations
    FOR UPDATE TO anon USING (true);


-- 3. Storage Bucket Setup
-- Note: Run this via Supabase UI or API if running the script fails
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', true) 
on conflict (id) do nothing;

CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');
    
CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'receipts');
