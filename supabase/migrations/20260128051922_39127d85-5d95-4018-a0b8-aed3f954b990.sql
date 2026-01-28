-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  show_on_thank_you_wall BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('live', 'in_progress', 'planned');

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  status project_status NOT NULL DEFAULT 'planned',
  external_url TEXT,
  image_url TEXT,
  tech_stack TEXT[],
  funding_goal DECIMAL(10,2),
  funding_raised DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Projects are viewable by everyone" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create artwork table
CREATE TABLE public.artwork (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'mixed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on artwork
ALTER TABLE public.artwork ENABLE ROW LEVEL SECURITY;

-- Artwork policies
CREATE POLICY "Artwork is viewable by everyone" ON public.artwork
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage artwork" ON public.artwork
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create writing_category enum
CREATE TYPE public.writing_category AS ENUM (
  'philosophy',
  'narrative',
  'cultural',
  'ux_review',
  'research'
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  category writing_category NOT NULL,
  reading_time_minutes INTEGER DEFAULT 5,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Articles policies
CREATE POLICY "Published articles are viewable by everyone" ON public.articles
  FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage articles" ON public.articles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create likes table (polymorphic)
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  likeable_type TEXT NOT NULL, -- 'project', 'artwork', 'article'
  likeable_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, likeable_type, likeable_id)
);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_name TEXT,
  proficiency INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Skills policies
CREATE POLICY "Skills are viewable by everyone" ON public.skills
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage skills" ON public.skills
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create learning_goals table
CREATE TABLE public.learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2),
  raised_amount DECIMAL(10,2) DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learning_goals
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- Learning goals policies
CREATE POLICY "Learning goals are viewable by everyone" ON public.learning_goals
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage learning goals" ON public.learning_goals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contribution_type TEXT NOT NULL, -- 'donation', 'project_sponsor', 'learning_fund'
  target_id UUID, -- project_id or learning_goal_id
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  message TEXT,
  show_publicly BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Contributions policies
CREATE POLICY "Public contributions are viewable" ON public.contributions
  FOR SELECT USING (show_publicly = true OR auth.uid() = user_id);

CREATE POLICY "Users can create contributions" ON public.contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get like count
CREATE OR REPLACE FUNCTION public.get_like_count(p_type TEXT, p_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.likes
  WHERE likeable_type = p_type AND likeable_id = p_id
$$;