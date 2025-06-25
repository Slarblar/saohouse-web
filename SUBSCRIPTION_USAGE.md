# Email Subscription Usage Guide

This guide shows how to integrate the MailerLite email subscription functionality into your React components.

## Quick Start

### 1. Basic Usage with the Hook

```tsx
import { useSubscription } from './hooks/useSubscription';

const SubscriptionForm: React.FC = () => {
  const { isLoading, isSuccess, error, subscribe, reset } = useSubscription();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email);
    if (isSuccess) {
      setEmail(''); // Clear form on success
    }
  };

  return (
    <form onSubmit={handleSubmit} className="subscription-form">
      <div className="form-group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
          className="email-input"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="subscribe-btn"
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>

      {/* Status Messages */}
      {isSuccess && (
        <div className="success-message">
          We'll be in touch! 🎉
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={reset} className="retry-btn">
            Try Again
          </button>
        </div>
      )}
    </form>
  );
};
```

### 2. Advanced Usage with Modal

```tsx
import { useSubscription } from './hooks/useSubscription';
import { useState, useEffect } from 'react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { isLoading, isSuccess, error, subscribe, reset } = useSubscription();
  const [email, setEmail] = useState('');

  // Auto close modal after successful subscription
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        reset();
        setEmail('');
      }, 2000);
    }
  }, [isSuccess, onClose, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Stay Updated</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          {!isSuccess ? (
            <form onSubmit={handleSubmit}>
              <p>Get notified about our latest updates and features!</p>
              
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  className="email-input"
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !email}
                >
                  {isLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          ) : (
            <div className="success-state">
              <div className="success-icon">✅</div>
              <h3>You're all set!</h3>
              <p>We'll be in touch with exciting updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. Integration with Existing SignUpForm

Update your existing `SignUpForm.tsx`:

```tsx
// Add to your existing SignUpForm component
import { useSubscription } from '../hooks/useSubscription';

const SignUpForm: React.FC = () => {
  const { isLoading, isSuccess, error, subscribe } = useSubscription();
  
  // Replace your existing form submission logic with:
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    await subscribe(email);
  };

  // Add status handling to your JSX:
  return (
    <form onSubmit={handleSubmit}>
      {/* Your existing form fields */}
      
      {isLoading && <div className="loading">Subscribing...</div>}
      {isSuccess && <div className="success">We'll be in touch!</div>}
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## Styling Examples

### CSS Classes for Form States

```css
.subscription-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.email-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.email-input:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.subscribe-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subscribe-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.subscribe-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.success-message {
  padding: 1rem;
  background: #10b981;
  color: white;
  border-radius: 0.5rem;
  text-align: center;
  margin-top: 1rem;
}

.error-message {
  padding: 1rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.retry-btn {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
}
```

## Testing

### Local Testing

1. Start your development server: `npm run dev`
2. Test the form with various email formats
3. Check browser console for any errors
4. Test success/error states

### Production Testing

```bash
# Test the deployed API endpoint
curl -X POST https://your-app.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Environment Setup

Make sure you've configured your environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - `MAILERLITE_API_KEY`: Your MailerLite API key
   - `MAILERLITE_GROUP_ID`: (Optional) Specific group ID

## Error Handling

The subscription system handles these error cases:

- **Invalid email format**: Client-side validation
- **Network errors**: Automatic retry suggestion
- **API failures**: User-friendly error messages
- **Rate limiting**: Specific timeout message
- **Duplicate emails**: Treats as success (user-friendly)

## Best Practices

1. **Progressive Enhancement**: Form works without JavaScript
2. **Accessibility**: Proper focus management and ARIA labels
3. **Performance**: Debounced validation for better UX
4. **Security**: Email validation on both client and server
5. **User Experience**: Clear loading and success states 