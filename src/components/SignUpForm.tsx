import React, { useState } from 'react'
import { X, Mail, User, Phone, Check } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

interface SignUpFormProps {
  onClose: () => void
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    phone: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isClosing, setIsClosing] = useState(false)
  
  // Use our new subscription hook
  const { isLoading: isSubmitting, isSuccess, error: subscriptionError, subscribe } = useSubscription()

  // Apply global modal blur effect
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    setIsClosing(false); // Reset closing state when opening
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Auto close modal after successful subscription
  React.useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        handleClose();
      }, 2500); // Slightly reduced to account for fade-out animation
    }
  }, [isSuccess]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Use our new subscription functionality
    await subscribe(formData.email)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    
    // Wait for fade-out animation to complete before calling onClose
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300) // Match the fade-out animation duration
  }

  if (isSuccess) {
    return (
      <div className={`signup-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
        <div className={`signup-modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
          <button 
            className="close-button" 
            onClick={handleClose}
            type="button"
            aria-label="Close modal"
            tabIndex={0}
          >
            <X size={20} />
          </button>
          
          <div className="success-content">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h2>Welcome to SaoHouse!</h2>
            <p>
              We'll be in touch! Thank you for joining our community. You'll receive updates on our 
              grand opening, special events, and exclusive member benefits.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`signup-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`signup-modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <button 
          className="close-button" 
          onClick={handleClose}
          type="button"
          aria-label="Close modal"
          tabIndex={0}
        >
          <X size={20} />
        </button>
        
        <div className="form-content">
          <h2>Join Our Community</h2>
          <p>
            Be the first to experience SaoHouse. Get early access to our space, 
            special events, and member-exclusive offerings.
          </p>
          
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                  disabled={isSubmitting}
                  aria-label="Email address"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
              {subscriptionError && !errors.email && <div className="error-message">{subscriptionError}</div>}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'error' : ''}
                  disabled={isSubmitting}
                  aria-label="First name"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              {errors.firstName && <div className="error-message">{errors.firstName}</div>}
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <Phone className="input-icon" size={20} />
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isSubmitting}
                  aria-label="Phone number (optional)"
                  autoComplete="tel"
                  inputMode="tel"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Submitting..." : "Join SaoHouse"}
              tabIndex={0}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Joining...
                </>
              ) : (
                'Join SaoHouse'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUpForm 