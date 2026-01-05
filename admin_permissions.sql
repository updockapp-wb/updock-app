-- SQL script to allow the admin user to delete any spot
-- Run this in the Supabase SQL Editor

-- 1. Policy for deletion
-- Replace the policy name if it already exists
DROP POLICY IF EXISTS "Admins can delete any spot" ON public.spots;
CREATE POLICY "Admins can delete any spot" 
ON public.spots
FOR DELETE 
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'updock.app@gmail.com'
);

-- 2. Policy for favorites deletion (to avoid FK issues)
DROP POLICY IF EXISTS "Admins can delete any favorite" ON public.favorites;
CREATE POLICY "Admins can delete any favorite" 
ON public.favorites
FOR DELETE 
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'updock.app@gmail.com'
);

-- Note: This ensures that even if you didn't create the spot, 
-- being logged in as updock.app@gmail.com gives you deletion rights.
