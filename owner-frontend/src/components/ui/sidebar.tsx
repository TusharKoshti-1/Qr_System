// src/components/ui/sidebar.tsx
import React from 'react'
import { FC, ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
  className?: string
}

export const Sidebar: FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className={`h-full w-64 bg-gray-800 text-white ${className}`}>
      {children}
    </div>
  )
}

export const SidebarHeader: FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className={`border-b p-4 ${className}`}>
      {children}
    </div>
  )
}

export const SidebarContent: FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className={`flex-1 p-4 ${className}`}>
      {children}
    </div>
  )
}

interface SidebarMenuProps {
  children: ReactNode
}

export const SidebarMenu: FC<SidebarMenuProps> = ({ children }) => {
  return <ul>{children}</ul>
}

interface SidebarMenuItemProps {
  children: ReactNode
}

export const SidebarMenuItem: FC<SidebarMenuItemProps> = ({ children }) => {
  return <li className="hover:bg-gray-700">{children}</li>
}

interface SidebarMenuButtonProps {
  children: ReactNode
  asChild?: boolean
}

export const SidebarMenuButton: FC<SidebarMenuButtonProps> = ({ children, asChild = false }) => {
  if (asChild) {
    return <>{children}</>
  }

  return <button className="flex items-center gap-2 w-full p-2 text-left">{children}</button>
}

interface SidebarProviderProps {
  children: ReactNode
}

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
  return <div className="flex flex-col">{children}</div>
}
