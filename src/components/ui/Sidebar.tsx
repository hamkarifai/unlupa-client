import { useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { X } from "@/components/foundations/hugeicons";
import { SidebarRoleSwitcher } from "@/components/ui/SidebarRoleSwitcher";
import { DashboardSidebarFooter } from "@/components/ui/SidebarFooter";
import { LogoutConfirmModal } from "@/features/dashboard/components/LogoutConfirmModal";
import { SidebarNavItems } from "@/components/ui/SidebarNavItems";
import {
  sidebarClassItems,
  NavClassItem,
} from "@/components/ui/SidebarClassItems";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const role = useAuthStore((s) => s.user?.role);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  return (
    <>
      {/* SIDEBAR DRAWER */}
      <aside className={`sidebar ${isOpen ? "active" : ""}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-brand-200 bg-white dark:bg-slate-950">
              <img
                src="/unlupa.logo.png"
                alt="Logo Unlupa"
                className="size-full scale-[1.45] object-contain"
                draggable={false}
              />
            </div>
            <span className="font-display font-bold text-xl text-foreground tracking-widest">
              UNLUPA
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher */}
        {(role === "admin" || role === "teacher") && (
          <div className="mb-8">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Mode Akun
            </p>
            <SidebarRoleSwitcher onClose={onClose} />
          </div>
        )}

        {/* Navigasi */}
        <div className="mb-8">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Navigasi
          </p>
          <SidebarNavItems />
        </div>

        {/* Room Navigation */}
        <div className="flex-1 overflow-y-auto pr-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Ruang Belajar
          </p>

          {sidebarClassItems.map((item) => (
            <NavClassItem
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              color={item.color}
              navClass={item.navClass}
              href={item.href}
              onClose={onClose}
            />
          ))}
        </div>

        {/* Sidebar Footer */}
        <DashboardSidebarFooter setShowLogoutConfirm={setShowLogoutConfirm} />
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal setShowLogoutConfirm={setShowLogoutConfirm} />
      )}
    </>
  );
};
