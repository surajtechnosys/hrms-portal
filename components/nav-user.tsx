"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { logoutUser } from "@/lib/actions/users"
import { userLogoutRequest } from "@/store/actions/user-actions"
import {
  ChevronsUpDownIcon,
  LogOutIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, state } = useSidebar()
  const dispatch = useDispatch()
  const router = useRouter()

  const handleLogout = async () => {
    dispatch(userLogoutRequest())
    await logoutUser()
    router.push("/login")
  }

  const fullName = user.name.trim().split(" ").slice(0, 2).join(" ")
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "rounded-2xl text-slate-800 hover:bg-slate-50/95 hover:text-slate-950 data-[state=open]:bg-cyan-50/90 data-[state=open]:text-slate-950",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Avatar className="h-9 w-9 rounded-2xl border border-slate-200/80 bg-cyan-50">
                <AvatarImage
                  src={user.avatar}
                  alt={fullName}
                />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-700 to-sky-600 font-semibold text-white">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className={cn("grid flex-1 text-left text-sm leading-tight", isCollapsed && "hidden")}>
                <span className="truncate font-medium text-slate-900">
                  {fullName}
                </span>
              </div>

              <ChevronsUpDownIcon className={cn("ml-auto size-4 text-slate-500", isCollapsed && "hidden")} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-2xl border border-slate-200/80">
                  <AvatarImage
                    src={user.avatar}
                    alt={fullName}
                  />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-700 to-sky-600 font-semibold text-white">
                    {fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-slate-800">
                    {fullName}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-200/70" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-xl text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
