/**
 * Client Controller - Placeholder endpoints
 * 
 * TODO: Implement real business logic when ready
 * - Fetch active jobs from database
 * - Fetch contracts from database
 * - Get user verification status
 * - Get billing method status
 */

import User from '../models/userModels.js';

/**
 * GET /api/client/dashboard/summary
 * Returns dashboard summary data for client
 * 
 * Response structure:
 * {
 *   success: boolean,
 *   activeJobsCount: number,
 *   contractsCount: number,
 *   emailVerified: boolean,
 *   phoneVerified: boolean,
 *   billingMethodAdded: boolean
 * }
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Get user from request (set by userAuth middleware)
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // TODO: Fetch real counts from Job and Contract models when they exist
    // For now, return placeholder data
    const summary = {
      success: true,
      activeJobsCount: 0, // TODO: Count from Job model where clientId = userId and status = 'active'
      contractsCount: 0, // TODO: Count from Contract model where clientId = userId and status = 'in_progress'
      emailVerified: user.isAccountVerified || false,
      phoneVerified: false, // TODO: Add phoneVerified field to User model
      billingMethodAdded: false // TODO: Check if user has billing method in PaymentMethod model
    };

    return res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
