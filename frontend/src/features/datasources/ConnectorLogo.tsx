import React from 'react'
import { DataSourceType } from '@/types/datasource'

interface ConnectorLogoProps {
  type: DataSourceType
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ConnectorLogo: React.FC<ConnectorLogoProps> = ({
  type,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-10 h-10 p-1.5 text-sm',
    lg: 'w-12 h-12 p-2 text-base',
  }[size]

  switch (type) {
    case 'postgres':
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
          title="PostgreSQL"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full fill-current text-[#336791]">
            <path d="M31.9 4c-15.4 0-27.9 12.5-27.9 27.9 0 7 2.6 13.5 6.9 18.5l-.2 9.6 9.3-3.6c3.6 2.1 7.7 3.3 12 3.3 15.4 0 27.9-12.5 27.9-27.9S47.3 4 31.9 4zm-1.8 11.2c2.2 0 4.1.8 5.7 2.3 1.5 1.5 2.3 3.4 2.3 5.6 0 1.9-.6 3.6-1.8 5l5.5 3.3-2.6 4.3-5.5-3.3c-1.1.8-2.3 1.2-3.7 1.2-2.2 0-4.1-.8-5.6-2.3s-2.3-3.4-2.3-5.6c0-2.2.8-4.1 2.3-5.6 1.6-1.6 3.5-2.3 5.7-2.3zm12.3 22.8c-2.4 3.7-6.5 6-11.2 6.3l-.6-4.5c3.2-.2 6-1.7 7.6-4.2l4.2 2.4z" />
          </svg>
        </div>
      )

    case 'bigquery':
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
          title="Google BigQuery"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <path fill="#4285F4" d="M32 6l22 13v26L32 58 10 45V19z" opacity="0.15" />
            <path fill="#4285F4" d="M32 10L14 20.5v21L32 52l18-10.5v-21L32 10z" />
            <path fill="#EA4335" d="M32 20l-9 5v10l9 5 9-5V25l-9-5z" />
            <path fill="#FBBC05" d="M32 26l-4 2.3v4.6l4 2.3 4-2.3v-4.6L32 26z" />
            <path fill="#34A853" d="M39 37l6 6-3 3-6-6z" />
          </svg>
        </div>
      )

    case 'snowflake':
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
          title="Snowflake"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full fill-current text-[#29B5E8]">
            <path d="M32 4c-1.1 0-2 .9-2 2v9.3l-6.6-6.6c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8l6.6 6.6H18c-1.1 0-2 .9-2 2s.9 2 2 2h9.2l-6.6 6.6c-.8.8-.8 2 0 2.8.4.4.9.6 1.4.6s1-.2 1.4-.6L30 25.1v9.8l-8.5-4.9c-1-.6-2.2-.2-2.8.7-.6 1-.2 2.2.7 2.8l8.5 4.9-8.5 4.9c-1 .6-1.3 1.8-.7 2.8.4.7 1.2 1.1 1.9 1.1.3 0 .6-.1.9-.2l8.5-4.9v9.8l-6.6-6.6c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8l6.6 6.6H18c-1.1 0-2 .9-2 2s.9 2 2 2h9.2l-6.6 6.6c-.8.8-.8 2 0 2.8.4.4.9.6 1.4.6s1-.2 1.4-.6L30 52.9V62c0 1.1.9 2 2 2s2-.9 2-2v-9.1l6.6 6.6c.4.4.9.6 1.4.6s1-.2 1.4-.6c.8-.8.8-2 0-2.8l-6.6-6.6H46c1.1 0 2-.9 2-2s-.9-2-2-2h-9.2l6.6-6.6c.8-.8.8-2 0-2.8-.8-.8-2-.8-2.8 0L34 38.9v-9.8l8.5 4.9c.3.2.6.2.9.2.7 0 1.5-.4 1.9-1.1.6-1 .2-2.2-.7-2.8L36 25.4l8.5-4.9c1-.6 1.3-1.8.7-2.8-.6-1-1.8-1.3-2.8-.7L34 21.9v-9.8l6.6 6.6c.4.4.9.6 1.4.6s1-.2 1.4-.6c.8-.8.8-2 0-2.8L36.8 9.3H46c1.1 0 2-.9 2-2s-.9-2-2-2h-9.2l6.6-6.6c.8-.8.8-2 0-2.8s-2-.8-2.8 0L34 4.5V2c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
      )

    case 'mysql':
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
          title="MySQL"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <path fill="#00758F" d="M12 44c4-12 14-20 28-22 6-1 12 1 16 5-4 1-7 4-8 8-2 7-6 11-12 13-8 3-17 1-24-4z" />
            <path fill="#F29111" d="M48 24c3 3 5 8 5 13-1 8-7 15-15 17-6 2-13 0-18-4 7 0 13-2 18-6 5-4 8-9 10-15v-5z" />
          </svg>
        </div>
      )

    case 'redshift':
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
          title="Amazon Redshift"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full fill-current text-[#D13212]">
            <path d="M32 6l24 13.9v28.2L32 62 8 48.1V19.9L32 6zm0 7.8L14.7 23.8 32 33.8l17.3-10-17.3-10zm19.3 14.2L34 38v19.4l17.3-10V28zm-23.3 0L10.7 28v19.4L28 57.4V38z" />
          </svg>
        </div>
      )

    default:
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 ${className}`}
        >
          <span className="font-bold text-slate-700 font-mono uppercase">
            {String(type).slice(0, 2)}
          </span>
        </div>
      )
  }
}
