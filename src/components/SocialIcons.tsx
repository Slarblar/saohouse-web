import React from 'react'
import { Instagram } from 'lucide-react'

// Custom TikTok icon using the user's logo
const TikTokIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg 
    width={size * 0.72} 
    height={size * 0.72} 
    viewBox="0 0 100 100" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', margin: '0 auto' }}
  >
    <path d="M67.24,72.41V29.31s4.86,8.1,22.43,8.6c.94.03,1.71-.74,1.71-1.68v-12.18c0-.91-.72-1.62-1.63-1.68-13.63-.77-20.1-11.22-20.73-20.81-.06-.89-.83-1.56-1.73-1.56h-13.89c-.93,0-1.68.75-1.68,1.68v68.52c0,7.44-5.69,13.92-13.12,14.27-8.5.4-15.41-6.89-14.36-15.51.74-6.09,5.63-11.08,11.71-11.92,1.21-.17,2.39-.18,3.53-.05,1.01.11,1.9-.64,1.9-1.65v-12.21c0-.87-.66-1.62-1.53-1.67-1.74-.11-3.53-.07-5.34.13-13.4,1.52-24.22,12.36-25.7,25.77-1.96,17.69,11.83,32.66,29.12,32.66,16.19,0,29.31-13.12,29.31-29.31" />
  </svg>
)

const SocialIcons: React.FC = () => {
  const socialLinks = [
    {
      name: 'TikTok',
      icon: TikTokIcon,
      url: 'https://tiktok.com/@saohouse',
      color: '#ff0050',
      hoverColor: '#ff1a66',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/saohouse',
      color: '#E4405F',
      hoverColor: '#833AB4',
    },
  ]

  return (
    <div className="social-icons">
      {socialLinks.map((social, index) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          style={{
            '--social-color': social.color,
            '--social-hover-color': social.hoverColor,
            '--animation-delay': `${1.2 + index * 0.1}s`,
          } as React.CSSProperties}
          aria-label={`Follow us on ${social.name}`}
          role="button"
          tabIndex={0}
        >
          <social.icon size={24} />
          <span className="social-tooltip">{social.name}</span>
        </a>
      ))}
    </div>
  )
}

export default SocialIcons 