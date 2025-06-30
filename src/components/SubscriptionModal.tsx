import React, { useState, useEffect } from 'react';
import { X, Send, Check, AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import './SubscriptionModal.css';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const { isLoading, isSuccess, error, subscribe, reset, successMessage } = useSubscription();

  // Apply global modal blur effect
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setIsClosing(false); // Reset closing state when opening
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Auto close modal after successful subscription (2.5 seconds + fade-out time)
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        handleClose();
      }, 2500); // Slightly reduced to account for fade-out animation
    }
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      await subscribe(email.trim());
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    
    // Wait for fade-out animation to complete before calling onClose
    setTimeout(() => {
      onClose();
      reset();
      setEmail('');
      setIsClosing(false);
    }, 300); // Match the fade-out animation duration
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`subscription-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`subscription-modal ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="close-button" 
          onClick={handleClose}
          type="button"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        
        <div className="subscription-content">
          {!isSuccess ? (
            <>
              <h2 className="subscription-title">STAY CONNECTED</h2>
              <p className="subscription-subtitle">
                Join our community for updates and exclusive content
              </p>
              
              <form className="subscription-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                    className={`email-input ${error ? 'error' : ''}`}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="send-button"
                    aria-label={isLoading ? "Sending..." : "Subscribe"}
                  >
                    {isLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="success-state">
              <div className="success-icon">
                <Check size={24} />
              </div>
              <div className="success-content">
                {successMessage ? (
                  successMessage.split('\n').map((line, index) => (
                    <div key={index} className={index === 0 ? 'success-title' : 'success-subtitle'}>
                      {line}
                    </div>
                  ))
                ) : (
                  <>
                    <h3 className="success-title">Thanks for Joining</h3>
                    <p className="success-subtitle">We'll be in touch</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal; 