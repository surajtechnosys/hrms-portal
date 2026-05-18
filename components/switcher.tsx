"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { ChevronRight } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

type SwitcherMenuItem = {
  name: string
  url: string
  icon: React.ReactNode
}

type SwitcherMenu = {
  name: string
  icon: React.ReactNode
  children?: SwitcherMenuItem[]
}

export function Switcher({ menu }: { menu: SwitcherMenu }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, state } = useSidebar()
  const [open, setOpen] = React.useState(false)

  const isActive = menu.children?.some((item: SwitcherMenuItem) =>
    pathname.startsWith(item.url)
  )
  const children = menu.children ?? []

  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      `
                rounded-[1.35rem] cursor-pointer transition-all duration-200
                ${isActive
                        ? "bg-gradient-to-r from-slate-900 via-cyan-700 to-sky-600 text-white shadow-[0_18px_34px_-20px_rgba(8,145,178,0.6)]"
                        : "text-slate-700 hover:bg-slate-50/95 hover:text-slate-950"
                      }
              `,
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <div
                      className={cn(
                        `
                  flex aspect-square size-9 items-center justify-center rounded-2xl
                  ${isActive
                          ? "bg-white/14 text-white ring-1 ring-white/18"
                          : "border border-slate-200/80 bg-white text-cyan-700 shadow-sm"
                        }
                `,
                        isCollapsed && "size-10"
                      )}
                    >
                      {menu.icon}
                    </div>

                    <div className={cn("grid min-w-0 flex-1 text-left text-sm leading-tight", isCollapsed && "hidden")}>
                      <span className="truncate font-medium">{menu.name}</span>
                    </div>

                    <div className={cn("flex items-center gap-2 group-data-[collapsible=icon]:hidden", isCollapsed && "hidden")}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-white/14 text-white"
                            : "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/80"
                        }`}
                      >
                        {children.length}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                          open ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="border-0 bg-slate-900 text-white shadow-xl">
                  {menu.name}
                </TooltipContent>
              )}

              <DropdownMenuContent
                className="min-w-60 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={10}
              >
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {menu.name}
                  </p>
                </div>

                {children.map((m: SwitcherMenuItem, index: number) => (
                  <DropdownMenuItem
                    key={m.name}
                    className="cursor-pointer gap-3 rounded-[1rem] p-2.5 text-slate-700 hover:bg-slate-50 focus:bg-slate-50"
                    onSelect={() => router.push(m.url)}
                  >
                    <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-cyan-700 to-sky-600 text-white shadow-[0_14px_24px_-16px_rgba(8,145,178,0.55)]">
                      {m.icon}
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{m.name}</span>
                      {pathname.startsWith(m.url) ? (
                        <span className="h-2 w-2 rounded-full bg-cyan-700" />
                      ) : null}
                    </div>

                    <DropdownMenuShortcut className="text-slate-400">
                      {index + 1}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-1 bg-slate-200/70" />
              </DropdownMenuContent>
            </Tooltip>
          </TooltipProvider>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
