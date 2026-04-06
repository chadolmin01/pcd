'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: string
  title?: string
  action?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'sketch' | 'technical' | 'flat' | 'solid'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'p-6',
  title,
  action,
  onClick,
  variant = 'default',
}) => {
  const baseClasses = 'transition-all duration-200 rounded-xl'

  const defaultClasses = 'bg-surface-card border border-border hover:border-border-strong hover:shadow-sm'
  const technicalClasses =
    'bg-surface-sunken/30 border border-dashed border-border-strong hover:bg-surface-card hover:border-border-strong'
  const flatClasses = 'bg-surface-sunken/50 border border-border-subtle'
  const solidClasses = ''

  let variantClasses = defaultClasses
  if (variant === 'technical') variantClasses = technicalClasses
  if (variant === 'flat') variantClasses = flatClasses
  if (variant === 'solid') variantClasses = solidClasses

  return (
    <div
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className={`px-6 py-4 border-b border-border-subtle flex justify-between items-center`}>
          {title && (
            <h3 className="font-sans font-bold text-txt-primary text-sm tracking-tight">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  )
}

export default Card
