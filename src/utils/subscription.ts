// TypeScript interfaces for API communication
export interface SubscriptionRequest {
  email: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// API endpoint URL
const API_ENDPOINT = '/api/subscribe';

/**
 * Subscribe an email to the MailerLite mailing list
 * @param email - The email address to subscribe
 * @returns Promise with subscription result
 */
export async function subscribeToNewsletter(email: string): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email } satisfies SubscriptionRequest),
    });

    const data: SubscriptionResponse = await response.json();
    
    // Return the response data regardless of HTTP status
    // The serverless function handles proper error formatting
    return data;
    
  } catch (error) {
    console.error('Network error during subscription:', error);
    
    // Return a user-friendly error for network failures
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Validate email format on the frontend
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Hook interface for subscription state management
 * Use this interface when creating your React hook in a component file
 */
export interface UseSubscriptionState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  subscribe: (email: string) => Promise<void>;
  reset: () => void;
} 