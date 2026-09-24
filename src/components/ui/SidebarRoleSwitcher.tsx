import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useDashboardModeStore } from "@/features/dashboard/stores/dashboard-mode.store";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  GraduationCap,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface SidebarRoleSwitcherProps {
  onClose?: () => void;
}

export const SidebarRoleSwitcher = ({ onClose }: SidebarRoleSwitcherProps) => {
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role);
  const activeRole = useDashboardModeStore((state) => state.activeRole);
  const setActiveRole = useDashboardModeStore((state) => state.setActiveRole);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Configuration for each role
  const roleConfig = {
    student: {
      label: "Pelajar",
      icon: GraduationCap,
      color: "text-success",
      bg: "bg-success/10",
      border: "group-hover:border-success/50",
    },
    teacher: {
      label: "Guru",
      icon: BookOpen,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "group-hover:border-warning/50",
    },
    admin: {
      label: "Admin",
      icon: ShieldCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "group-hover:border-primary/50",
    },
  };

  const currentConfig = roleConfig[activeRole] || roleConfig.student;
  const RoleIcon = currentConfig.icon;

  const availableRoles = [];
  if (userRole === "student") availableRoles.push("student");
  if (userRole === "teacher") availableRoles.push("student", "teacher");
  if (userRole === "admin") availableRoles.push("student", "teacher", "admin");

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group",
          "bg-surface-1 hover:bg-surface-2",
          "border-border",
          currentConfig.border,
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
              currentConfig.bg,
              currentConfig.color,
            )}
          >
            <RoleIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Mode
            </p>
            <p className="text-sm font-medium text-foreground">
              {currentConfig.label}
            </p>
          </div>
        </div>

        <ChevronDown
          className={clsx(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1">
            {availableRoles.map((role: any) => {
              const config = roleConfig[role as keyof typeof roleConfig];
              const Icon = config.icon;
              const isActive = activeRole === role;

              return (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    setIsOpen(false);
                    onClose?.();
                    if (role === "student") {
                      navigate("/dashboard/alquran");
                    } else if (role === "teacher") {
                      navigate("/dashboard/kelas");
                    } else {
                      navigate("/dashboard");
                    }
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 p-2 rounded-xl transition-all",
                    isActive
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:bg-surface-1 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4",
                      isActive ? config.color : "opacity-50",
                    )}
                  />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
