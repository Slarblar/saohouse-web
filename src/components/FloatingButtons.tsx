import React, { useState } from 'react';
import { Mail, X, Send } from 'lucide-react';
import './FloatingButtons.css';

const FloatingButtons: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Apply glass morphism blur effect when modal is open
  React.useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    
    // Close modal after success
    setTimeout(() => {
      setIsModalOpen(false);
      setSubmitted(false);
      setEmail('');
    }, 2000);
  };

  return (
    <>
      {/* Floating Button Bar */}
      <div className="floating-buttons">
        <a 
          href="https://www.instagram.com/saohouse" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-icon-btn instagram-btn"
          aria-label="Follow us on Instagram"
          role="button"
          tabIndex={0}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
        </a>
        
        <a 
          href="https://www.tiktok.com/@saohouse" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-icon-btn tiktok-btn"
          aria-label="Follow us on TikTok"
          role="button"
          tabIndex={0}
        >
          <svg 
            width="17.28" 
            height="17.28" 
            viewBox="0 0 100 100" 
            fill="currentColor"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <path d="M67.24,72.41V29.31s4.86,8.1,22.43,8.6c.94.03,1.71-.74,1.71-1.68v-12.18c0-.91-.72-1.62-1.63-1.68-13.63-.77-20.1-11.22-20.73-20.81-.06-.89-.83-1.56-1.73-1.56h-13.89c-.93,0-1.68.75-1.68,1.68v68.52c0,7.44-5.69,13.92-13.12,14.27-8.5.4-15.41-6.89-14.36-15.51.74-6.09,5.63-11.08,11.71-11.92,1.21-.17,2.39-.18,3.53-.05,1.01.11,1.9-.64,1.9-1.65v-12.21c0-.87-.66-1.62-1.53-1.67-1.74-.11-3.53-.07-5.34.13-13.4,1.52-24.22,12.36-25.7,25.77-1.96,17.69,11.83,32.66,29.12,32.66,16.19,0,29.31-13.12,29.31-29.31" />
          </svg>
        </a>
        
        <button 
          className="comms-btn"
          onClick={() => setIsModalOpen(true)}
          aria-label="Join our community"
          type="button"
          tabIndex={0}
        >
          <Mail size={20} />
        </button>
      </div>



      {/* Signup Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              type="button"
              tabIndex={0}
            >
              <X size={16} />
            </button>
            
            {submitted ? (
              <div className="success-state">
                <div className="success-icon">
                  <Send size={32} />
                </div>
                <h3>Welcome aboard!</h3>
                <p>We'll be in touch soon.</p>
              </div>
            ) : (
              <div className="signup-form">
                <h2>Stay Connected</h2>
                <p>Join our community for updates and exclusive content</p>
                
                <form onSubmit={handleSubmit}>
                  <div className="email-input-wrapper">
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="email-input"
                      aria-label="Email address"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button 
                      type="submit" 
                      className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                      disabled={isSubmitting}
                      aria-label={isSubmitting ? "Submitting..." : "Submit email"}
                      tabIndex={0}
                    >
                      {isSubmitting ? (
                        <div className="spinner"></div>
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingButtons; 