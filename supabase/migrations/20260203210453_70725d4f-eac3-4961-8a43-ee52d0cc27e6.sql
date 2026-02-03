-- Create contact_inquiries table for storing contact form submissions
CREATE TABLE public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (public insert)
CREATE POLICY "Anyone can submit contact form" 
ON public.contact_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view contact inquiries" 
ON public.contact_inquiries 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update status
CREATE POLICY "Admins can update contact inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Index for status filtering
CREATE INDEX idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX idx_contact_inquiries_created ON public.contact_inquiries(created_at DESC);