import { useState } from 'react';
import { 
  subscribeToNewsletter, 
  validateEmail, 
  type UseSubscriptionState 
} from '../utils/subscription';

/**
 * React hook for managing email subscription state
 * 
 * Usage example:
 * ```tsx
 * import { useSubscription } from '@/hooks/useSubscription';
 * 
 * const MyComponent = () => {
 *   const { isLoading, isSuccess, error, subscribe, reset } = useSubscription();
 * 
 *   const handleSubmit = async (email: string) => {
 *     await subscribe(email);
 *   };
 * 
 *   return (
 *     <div>
 *       {isLoading && <p>Subscribing...</p>}
 *       {isSuccess && <p>Successfully subscribed!</p>}
 *       {error && <p>Error: {error}</p>}
 *       <button onClick={() => handleSubmit('test@example.com')}>
 *         Subscribe
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useSubscription(): UseSubscriptionState {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const subscribe = async (email: string): Promise<void> => {
    // Reset previous state
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);
    setSuccessMessage(null);

    // Validate email on frontend first
    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await subscribeToNewsletter(email);
      
      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(result.message || 'Thanks for Joining\nWe\'ll be in touch');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = (): void => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
    setSuccessMessage(null);
  };

  return {
    isLoading,
    isSuccess,
    error,
    successMessage,
    subscribe,
    reset,
  };
} 