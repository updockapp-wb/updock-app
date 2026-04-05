-- Allow spot creator or admin to update their spot
CREATE POLICY "spot_owner_or_admin_update" ON public.spots
FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'updock.app@gmail.com'
)
WITH CHECK (
    auth.uid() = user_id
    OR auth.jwt() ->> 'email' = 'updock.app@gmail.com'
);
