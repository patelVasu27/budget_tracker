import { Utensils, Car, Lightbulb, Film, ShoppingBag, Pill, Box, type LucideIcon } from 'lucide-react'

type CategoryName = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Health' | 'Other' | string

interface CategoryIconProps {
  category: CategoryName
  color?: string | null
  icon?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const CATEGORY_METADATA: Record<string, {
  icon: LucideIcon
  bgClass: string
  borderClass: string
  textClass: string
  emoji: string
}> = {
  Food: {
    icon: Utensils,
    bgClass: 'bg-[#EAF0E9]',
    borderClass: 'border-[#CCE0CC]',
    textClass: 'text-[#2D6A4F]',
    emoji: '🍽️',
  },
  Transport: {
    icon: Car,
    bgClass: 'bg-[#EFF1EE]',
    borderClass: 'border-[#D4DAD1]',
    textClass: 'text-[#5A6B5E]',
    emoji: '🚗',
  },
  Utilities: {
    icon: Lightbulb,
    bgClass: 'bg-[#FAF5E8]',
    borderClass: 'border-[#ECDDBE]',
    textClass: 'text-[#C5923C]',
    emoji: '💡',
  },
  Entertainment: {
    icon: Film,
    bgClass: 'bg-[#FDF3EE]',
    borderClass: 'border-[#F8DCCB]',
    textClass: 'text-[#D95D39]',
    emoji: '🎬',
  },
  Shopping: {
    icon: ShoppingBag,
    bgClass: 'bg-[#E6F3EE]',
    borderClass: 'border-[#C1E3D5]',
    textClass: 'text-[#1E6B4B]',
    emoji: '🛍️',
  },
  Health: {
    icon: Pill,
    bgClass: 'bg-[#FDF2F0]',
    borderClass: 'border-[#F9D7CF]',
    textClass: 'text-[#E0522B]',
    emoji: '💊',
  },
  Other: {
    icon: Box,
    bgClass: 'bg-[#EEF1EB]',
    borderClass: 'border-[#DEE2DB]',
    textClass: 'text-[#1B2A1E]',
    emoji: '📦',
  },
}

const DEFAULT_METADATA = {
  icon: Box,
  bgClass: 'bg-[#EEF1EB]',
  borderClass: 'border-[#DEE2DB]',
  textClass: 'text-[#1B2A1E]',
  emoji: '📦',
}

export function CategoryIcon({ category, color, icon, className = '', size = 'md' }: CategoryIconProps) {
  const meta = CATEGORY_METADATA[category] || DEFAULT_METADATA
  const IconComponent = meta.icon

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-xs border min-w-[36px] min-h-[36px]',
    md: 'w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl text-sm border',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl text-base border',
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  const hasDynamic = (color != null && color !== '') || (icon != null && icon !== '')
  if (hasDynamic) {
    const dynamicStyle = color
      ? { backgroundColor: `${color}14`, borderColor: `${color}45`, color }
      : undefined
    return (
      <div
        className={`flex-shrink-0 flex items-center justify-center ${sizeClasses[size]} ${className}`}
        style={dynamicStyle}
        aria-hidden="true"
      >
        {icon ? (
          <span className={size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-2xl'}>{icon}</span>
        ) : (
          <IconComponent size={iconSizes[size]} strokeWidth={2.2} />
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center transition-transform duration-300 ${sizeClasses[size]} ${meta.bgClass} ${meta.borderClass} ${meta.textClass} ${className}`}
      aria-hidden="true"
    >
      <IconComponent size={iconSizes[size]} strokeWidth={2.2} />
    </div>
  )
}

export function getCategoryEmoji(categoryName: string): string {
  return CATEGORY_METADATA[categoryName]?.emoji || '📦'
}
