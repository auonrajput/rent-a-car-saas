-- 1. Add missing columns safely
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PKR';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'Active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Owner';

-- 2. Update existing tenants to Owner role if null
UPDATE tenants SET role = 'Owner' WHERE role IS NULL;

-- 3. Enable Row Level Security on core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies safely to prevent "already exists" errors
DROP POLICY IF EXISTS "Tenants can view own tenant profile" ON tenants;
DROP POLICY IF EXISTS "Tenants can update own record" ON tenants;
DROP POLICY IF EXISTS "Tenants can manage own cars" ON cars;
DROP POLICY IF EXISTS "Tenants can manage own bookings" ON bookings;

-- 5. Re-create correct RLS policies
CREATE POLICY "Tenants can view own tenant profile" 
ON tenants 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Tenants can update own record"
ON tenants
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Tenants can manage own cars" 
ON cars 
FOR ALL 
USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can manage own bookings" 
ON bookings 
FOR ALL 
USING (auth.uid() = tenant_id);

-- 6. Customers Table & RLS
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  cnic text NOT NULL,
  license_number text NOT NULL,
  is_blacklisted boolean DEFAULT false,
  blacklist_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable tenant isolation for customers" ON public.customers;
CREATE POLICY "Enable tenant isolation for customers" ON public.customers
  USING (tenant_id = auth.uid());

-- 7. Maintenance Table & RLS
CREATE TABLE IF NOT EXISTS public.maintenance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  title text NOT NULL,
  cost numeric NOT NULL,
  maintenance_date date NOT NULL,
  next_due_date date,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable tenant isolation for maintenance" ON public.maintenance;
CREATE POLICY "Enable tenant isolation for maintenance" ON public.maintenance
  USING (tenant_id = auth.uid());
  -- Add signature and agreement status columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_cnic TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cnic_front_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cnic_back_url TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PKR';
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.bookings ALTER COLUMN start_date TYPE TEXT;
ALTER TABLE public.bookings ALTER COLUMN end_date TYPE TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cnic_image_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;