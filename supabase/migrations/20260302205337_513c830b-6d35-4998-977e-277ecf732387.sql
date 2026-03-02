-- Allow admins to delete contact inquiries
CREATE POLICY "Admins can delete contact inquiries"
ON public.contact_inquiries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete email subscribers
CREATE POLICY "Admins can delete subscribers"
ON public.email_subscribers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
