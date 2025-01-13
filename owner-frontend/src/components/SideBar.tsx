'use client'

import { BarChart3, ShieldCheck, MenuIcon, ShoppingCart, Package, LineChart } from 'lucide-react'
import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from './ui/sidebar'

export function DashboardSidebar() {
  return (
    <Sidebar className="border-r bg-[#6366F1] text-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/10 p-2">
            <Package className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">Dabang</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard" className="w-full">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/authentication" className="w-full">
                <ShieldCheck className="h-4 w-4" />
                <span>Authentication</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/menu" className="w-full">
                <MenuIcon className="h-4 w-4" />
                <span>Menu</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/order" className="w-full">
                <ShoppingCart className="h-4 w-4" />
                <span>Order</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/products" className="w-full">
                <Package className="h-4 w-4" />
                <span>Products</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/sales" className="w-full">
                <LineChart className="h-4 w-4" />
                <span>Sales Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

