-- SQL Script to create the 'sellers' table in Supabase
-- You can run this script directly in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    website TEXT,
    facebook_page TEXT,
    instagram_page TEXT,
    address TEXT NOT NULL,
    area_block TEXT,
    city TEXT NOT NULL,
    branches TEXT DEFAULT 'No',
    branch_address TEXT,
    branch_phone TEXT,
    branch_whatsapp TEXT,
    province TEXT,
    google_maps_link TEXT,
    category TEXT NOT NULL,
    sub_categories TEXT,
    business_description TEXT,
    operating_hours TEXT,
    verified_seller BOOLEAN DEFAULT FALSE,
    featured_seller BOOLEAN DEFAULT FALSE,
    premium_seller BOOLEAN DEFAULT FALSE,
    status_active BOOLEAN DEFAULT TRUE,
    status_inactive BOOLEAN DEFAULT FALSE,
    status_suspended BOOLEAN DEFAULT FALSE,
    listings_hidden BOOLEAN DEFAULT FALSE,
    latitude TEXT,
    longitude TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) if required by your Supabase setup.
-- If you want it public for now (matching the other tables setup):
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.sellers
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.sellers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.sellers
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON public.sellers
    FOR DELETE USING (true);
