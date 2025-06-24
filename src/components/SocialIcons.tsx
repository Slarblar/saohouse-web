import React from 'react'
import { Instagram, Music } from 'lucide-react'

const SocialIcons: React.FC = () => {
  const socialLinks = [
    {
      name: 'TikTok',
      icon: Music,
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