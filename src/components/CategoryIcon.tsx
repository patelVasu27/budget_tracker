import { Utensils, Car, Lightbulb, Film, ShoppingBag, Pill, Box, type LucideIcon } from 'lucide-react'

type CategoryName = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Health' | 'Other' | string

interface CategoryIconProps {
  category: CategoryName
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

export function CategoryIcon({ category, className = '', size = 'md' }: CategoryIconProps) {
  const meta = CATEGORY_METADATA[category] || DEFAULT_METADATA
  const IconComponent = meta.icon

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs border',
    md: 'w-11 h-11 rounded-xl text-sm border',
    lg: 'w-14 h-14 rounded-2xl text-base border-2',
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
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