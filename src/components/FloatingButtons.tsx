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
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.849-1.136-1.752-1.136-2.078V2h-3.039v11.83c0 1.132-.84 1.993-1.927 1.993-.632 0-1.196-.312-1.556-.793a1.962 1.962 0 0 1-.371-1.2c0-1.106.896-2.002 2.002-2.002.338 0 .659.085.938.236V8.797c-.324-.05-.658-.076-.998-.076-2.586 0-4.681 2.095-4.681 4.681 0 1.024.332 1.971.894 2.743a4.643 4.643 0 0 0 3.787 1.96c2.586 0 4.681-2.095 4.681-4.681V9.15a9.111 9.111 0 0 0 2.911 1.066V7.537c-.68 0-1.328-.137-1.925-.362z"/>
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