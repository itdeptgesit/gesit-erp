"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { APP_MENU_STRUCTURE } from "@/constants"
import { ArrowRight } from "lucide-react"

export function GlobalSearch({
  open,
  setOpen,
  userRole = "",
  userGroups = [],
}: {
  open: boolean
  setOpen: (open: boolean) => void
  userRole?: string
  userGroups?: string[]
}) {
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  const roleLower = (userRole || "").toLowerCase().trim()
  const isAdmin =
    roleLower.includes("admin") ||
    roleLower.includes("owner") ||
    userGroups.some((g) => {
      const gl = (g || "").toLowerCase().trim()
      return gl === "admin" || gl === "super admin"
    })
  const isITOrAdmin =
    isAdmin ||
    roleLower.includes("staff") ||
    roleLower.includes("it") ||
    userGroups.some((g) => {
      const gl = (g || "").toLowerCase().trim()
      return gl === "staff" || gl === "it" || gl === "it_staff" || gl === "it-operations" || gl === "support"
    })

  // Menu yang boleh dilihat oleh akun user biasa di pencarian global
  const regularUserAllowedIds = new Set([
    "helpdesk",
    "asset-loan",
    "office-layout",
    "extension-directory",
  ])

  const mainMenus = APP_MENU_STRUCTURE.filter((m) => {
    const hasChildren = APP_MENU_STRUCTURE.some((c) => c.parentId === m.id);
    if (hasChildren || m.parentId === "admin") return false;
    if (!isITOrAdmin) {
      return regularUserAllowedIds.has(m.id);
    }
    return true;
  });
  const adminMenus = isAdmin
    ? APP_MENU_STRUCTURE.filter((m) => m.parentId === "admin")
    : [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="General">
          {mainMenus.map((menu) => (
            <CommandItem
              key={menu.id}
              value={menu.label}
              onSelect={() =>
                runCommand(() =>
                  navigate(menu.id === "dashboard" ? "/" : `/${menu.id}`)
                )
              }
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
              <span>{menu.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {adminMenus.length > 0 && (
          <CommandGroup heading="Administration">
            {adminMenus.map((menu) => (
              <CommandItem
                key={menu.id}
                value={menu.label} // Value used for search matching
                onSelect={() => runCommand(() => navigate(`/${menu.id}`))}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <span>{menu.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
