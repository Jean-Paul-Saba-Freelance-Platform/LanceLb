/**
 * Mock data for Client Dashboard
 * 
 * TODO: Replace with real API calls when backend is ready
 * Expected API endpoint: GET /api/client/dashboard/summary
 * Expected response structure:
 * {
 *   activeJobsCount: number,
 *   contractsCount: number,
 *   emailVerified: boolean,
 *   phoneVerified: boolean,
 *   billingMethodAdded: boolean
 * }
 */

// Next steps onboarding data
export const nextStepsData = [
  {
    id: 1,
    title: 'Verify phone',
    description: 'Add a phone number to verify your account and improve security.',
    actionText: 'Add phone',
    actionRoute: '/client/settings?tab=verification',
    completed: false,
    icon: '📱'
  },
  {
    id: 2,
    title: 'Add billing method',
    description: 'Set up a payment method to start hiring and paying freelancers.',
    actionText: 'Add payment method',
    actionRoute: '/client/settings?tab=billing',
    completed: false,
    icon: '💳'
  },
  {
    id: 3,
    title: 'Confirm email',
    description: 'Verify your email address to receive important updates and notifications.',
    actionText: 'Resend verification',
    actionRoute: '/client/settings?tab=account',
    completed: false, // Will be set from user.isAccountVerified
    icon: '✉️'
  }
]

// Category data for "Find experts by category"
export const categoriesData = [
  {
    id: 1,
    title: 'Development',
    description: 'Web, mobile, and software developers',
    route: '/talent?category=development',
    icon: '💻'
  },
  {
    id: 2,
    title: 'Design',
    description: 'UI/UX, graphic, and visual designers',
    route: '/talent?category=design',
    icon: '🎨'
  },
  {
    id: 3,
    title: 'Writing',
    description: 'Content writers, copywriters, and editors',
    route: '/talent?category=writing',
    icon: '✍️'
  },
  {
    id: 4,
    title: 'Marketing',
    description: 'Digital marketing and SEO specialists',
    route: '/talent?category=marketing',
    icon: '📈'
  },
  {
    id: 5,
    title: 'Data & AI',
    description: 'Data scientists and AI engineers',
    route: '/talent?category=data-ai',
    icon: '🤖'
  },
  {
    id: 6,
    title: 'Business',
    description: 'Consultants and business analysts',
    route: '/talent?category=business',
    icon: '💼'
  }
]

// Help & Resources data
export const resourcesData = [
  {
    id: 1,
    title: 'How to post your first job',
    description: 'Learn the best practices for creating job posts that attract top talent and get quality proposals.',
    actionText: 'Learn more',
    route: '/help/post-job'
  },
  {
    id: 2,
    title: 'Tips for hiring safely',
    description: 'Discover strategies to verify freelancers, set clear expectations, and protect your projects.',
    actionText: 'Learn more',
    route: '/help/hiring-safety'
  },
  {
    id: 3,
    title: 'Understanding payments',
    description: 'Get familiar with our payment system, escrow protection, and how to manage project budgets.',
    actionText: 'Learn more',
    route: '/help/payments'
  }
]

// Default dashboard summary (fallback when API is not available)
export const defaultDashboardSummary = {
  activeJobsCount: 0,
  contractsCount: 0,
  emailVerified: false,
  phoneVerified: false,
  billingMethodAdded: false
}
