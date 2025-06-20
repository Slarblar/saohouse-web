import React, { useState } from 'react'
// Animation imports removed - not currently used
import { X, Mail, User, Phone, Check } from 'lucide-react'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsSuccess(true)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isSuccess) {
    return (
      <div className="signup-overlay" onClick={onClose}>
        <div className="signup-modal" onClick={e => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="success-content">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h2>Welcome to SaoHouse!</h2>
            <p>
              Thank you for joining our community. We'll keep you updated on our 
              grand opening, special events, and exclusive member benefits.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-overlay" onClick={onClose}>
      <div className="signup-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
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
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
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
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
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