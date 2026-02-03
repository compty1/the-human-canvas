// Helper for auto-generating updates when events occur
import { supabase } from "@/integrations/supabase/client";

interface AutoUpdateEvent {
  type: 'project_status' | 'article_published' | 'update_published' | 'donation_received' | 'experiment_added' | 'project_created';
  title: string;
  entityId?: string;
  entitySlug?: string;
  details?: Record<string, unknown>;
}

// Generate a slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 60) + '-' + Date.now();
};

// Create an auto-generated update entry
export const createAutoUpdate = async (event: AutoUpdateEvent): Promise<boolean> => {
  try {
    let updateTitle = '';
    let updateExcerpt = '';
    let tags: string[] = [];

    switch (event.type) {
      case 'project_status':
        updateTitle = `Project Update: ${event.title}`;
        updateExcerpt = event.details?.newStatus 
          ? `The project "${event.title}" status has been updated to ${String(event.details.newStatus).replace('_', ' ')}.`
          : `Updates on the ${event.title} project.`;
        tags = ['project', 'status-update'];
        break;

      case 'project_created':
        updateTitle = `New Project: ${event.title}`;
        updateExcerpt = `Started working on a new project: ${event.title}.`;
        tags = ['project', 'new'];
        break;

      case 'article_published':
        updateTitle = `New Article: ${event.title}`;
        updateExcerpt = `Published a new article: "${event.title}". Check it out!`;
        tags = ['article', 'writing'];
        break;

      case 'update_published':
        // Don't create an update about an update
        return true;

      case 'donation_received':
        updateTitle = `Thank You for Your Support!`;
        updateExcerpt = event.details?.amount 
          ? `Received a generous contribution of $${event.details.amount}. Thank you!`
          : 'Received a new contribution. Thank you for your support!';
        tags = ['donation', 'community'];
        break;

      case 'experiment_added':
        updateTitle = `New Experiment: ${event.title}`;
        updateExcerpt = `Started a new business experiment: ${event.title}.`;
        tags = ['experiment', 'business'];
        break;

      default:
        return false;
    }

    const slug = generateSlug(updateTitle);

    const { error } = await supabase.from('updates').insert({
      title: updateTitle,
      slug,
      excerpt: updateExcerpt,
      content: `<p>${updateExcerpt}</p>`,
      tags,
      published: true,
    });

    if (error) {
      console.error('Failed to create auto-update:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error creating auto-update:', err);
    return false;
  }
};

// Check if status has changed and create update if so
export const handleProjectStatusChange = async (
  projectId: string,
  projectTitle: string,
  oldStatus: string | null,
  newStatus: string
): Promise<void> => {
  // Only create update if status actually changed to a significant state
  if (oldStatus !== newStatus && ['live', 'in_progress'].includes(newStatus)) {
    await createAutoUpdate({
      type: 'project_status',
      title: projectTitle,
      entityId: projectId,
      details: { oldStatus, newStatus },
    });
  }
};

// Handle new donation
export const handleNewDonation = async (
  amount: number,
  donorName?: string
): Promise<void> => {
  await createAutoUpdate({
    type: 'donation_received',
    title: 'New Contribution',
    details: { amount, donorName },
  });
};
