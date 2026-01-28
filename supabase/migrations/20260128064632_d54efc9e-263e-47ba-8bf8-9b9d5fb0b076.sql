-- Create product_reviews table for comprehensive UX analysis
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  company TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Consumer Product',
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  summary TEXT,
  content TEXT,
  user_experience_analysis JSONB DEFAULT '{}',
  pain_points TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  technical_issues TEXT[] DEFAULT '{}',
  improvement_suggestions TEXT[] DEFAULT '{}',
  future_recommendations TEXT[] DEFAULT '{}',
  competitor_comparison JSONB DEFAULT '{}',
  user_complaints JSONB DEFAULT '{}',
  featured_image TEXT,
  screenshots TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view published reviews
CREATE POLICY "Published product reviews are viewable by everyone"
ON public.product_reviews
FOR SELECT
USING ((published = true) OR has_role(auth.uid(), 'admin'));

-- Admins can manage all reviews
CREATE POLICY "Admins can manage product reviews"
ON public.product_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Dexcom G7 comprehensive review
INSERT INTO public.product_reviews (
  product_name,
  company,
  slug,
  category,
  overall_rating,
  summary,
  content,
  user_experience_analysis,
  pain_points,
  strengths,
  technical_issues,
  improvement_suggestions,
  future_recommendations,
  user_complaints,
  published
) VALUES (
  'Dexcom G7',
  'Dexcom',
  'dexcom-g7',
  'Medical Device / Diabetes Technology',
  6,
  'The Dexcom G7 represents a significant step forward in CGM technology with its smaller form factor and faster warm-up time, but persistent connectivity issues, adhesive failures, and software bugs undermine the user experience for Type 1 diabetics who depend on this device for daily management.',
  '<h2>Executive Summary</h2><p>As a Type 1 diabetic who relies on continuous glucose monitoring for daily survival, the Dexcom G7 represents both promise and frustration. While the hardware improvements are welcome, the software reliability and overall user experience leave much to be desired for a medical device at this price point.</p><h2>Daily Usage Experience</h2><p>The G7 is meant to provide peace of mind, but instead creates new sources of anxiety. Bluetooth drops during sleep mean waking to hours of missing data. The app crashes at critical moments. Compression lows trigger alarms at 2 AM when glucose is actually stable.</p><h2>The Cost Factor</h2><p>At significant monthly cost even with insurance, users rightfully expect reliability. Instead, they get a device that requires workarounds, backup plans, and constant troubleshooting.</p>',
  '{
    "first_impressions": "Sleek, modern packaging. Smaller sensor size is immediately noticeable and appreciated. Application process is simpler than G6. 30-minute warm-up is a major improvement.",
    "daily_usage": "Mixed experience. When it works, it works well. But connectivity drops are frequent. Having to constantly check if the app is still receiving data defeats the purpose of continuous monitoring.",
    "learning_curve": "Moderate. The app interface is clean but some features are buried. Alert customization is confusing for new users.",
    "accessibility": "Font sizes could be larger. Color contrast for trend arrows could be improved. Audio alerts are limited in customization.",
    "error_handling": "Poor. Error messages are vague. When connection is lost, the app provides little guidance. Support articles are hard to find."
  }',
  ARRAY[
    'Sensor adhesive fails prematurely - many sensors fall off before the 10-day period, especially in hot weather or during exercise',
    'Bluetooth connectivity drops frequently, especially during sleep, resulting in gaps in critical health data',
    'App crashes and data synchronization failures cause loss of historical data needed for treatment decisions',
    '10-day sensor life is shorter than competitors offering 14-day sensors, increasing cost and insertion frequency',
    '30-minute warm-up time, while improved from G6, still creates gaps during sensor changes',
    'Compression lows trigger false urgent low alerts during sleep when lying on the sensor',
    'Alert fatigue from non-customizable alarm sounds and limited quiet hours options',
    'No ability to extend sensors even when they are still functioning accurately',
    'Limited historical data access in the mobile app - must use desktop Clarity for full analysis',
    'Insurance and cost barriers make reliable diabetes management a luxury'
  ],
  ARRAY[
    'Significantly smaller and more discreet than previous generations',
    'Faster 30-minute warm-up time vs 2-hour warm-up on G6',
    'Improved accuracy in the first 24 hours of sensor life',
    'One-piece applicator simplifies the insertion process',
    'Apple Watch integration allows quick glance at glucose readings',
    'Share feature enables caregivers to monitor remotely',
    'Trend arrows help predict glucose direction',
    'Integration with some insulin pump systems for automated delivery'
  ],
  ARRAY[
    'Frequent Bluetooth signal loss during sleep disrupts overnight monitoring',
    'App-hardware synchronization failures require force-closing and restarting',
    'iOS and Android apps have feature parity issues - some features only available on one platform',
    'Calibration accuracy varies significantly between sensors from the same box',
    'Integration issues with insulin pumps cause closed-loop systems to fall back to manual mode',
    'Memory leaks in the mobile app cause degraded performance over time',
    'Sensor errors requiring early replacement occur more frequently than acceptable for a medical device',
    'Firmware update process can brick sensors if interrupted'
  ],
  ARRAY[
    'Extend sensor life to 14+ days to match competitors and reduce cost burden',
    'Redesign adhesive formulation for better skin adhesion in various conditions',
    'Implement more robust Bluetooth connectivity with automatic reconnection',
    'Add fully customizable alert thresholds and sounds per time of day',
    'Improve compression low detection algorithm to reduce false alarms',
    'Enhanced data export options including CSV and integration with more third-party apps',
    'Better API access for developers to build complementary tools',
    'Implement sensor calibration option for users who want manual adjustment',
    'Add on-device backup so data is not lost when phone connection fails'
  ],
  ARRAY[
    'Develop a true closed-loop system with integrated pump that requires less user intervention',
    'Explore implantable sensors for 90+ day wear periods',
    'Create a dedicated receiver device for users who prefer not to use smartphones',
    'Invest in machine learning for predictive alerts that account for individual patterns',
    'Partner with health insurance companies to reduce cost barriers',
    'Open-source the data protocols to enable innovation in the diabetes community',
    'Develop companion app features for mental health support in diabetes management'
  ],
  '{
    "common_themes": [
      "Adhesive failures requiring additional patches or overlays",
      "Random sensor errors requiring early replacement",
      "Customer support response times exceeding 24 hours for urgent issues",
      "Replacement sensor shipment delays leaving users without monitoring",
      "Insurance prior authorization nightmares"
    ],
    "severity_breakdown": {
      "critical": "15% - Sensor failures causing dangerous undetected highs or lows",
      "major": "40% - Connectivity and app issues affecting daily management",
      "moderate": "30% - Adhesive and comfort issues",
      "minor": "15% - Feature requests and convenience improvements"
    },
    "user_sentiment": "Frustrated but dependent. Users recognize the value of CGM technology but feel trapped by limited competition and high switching costs."
  }',
  true
);