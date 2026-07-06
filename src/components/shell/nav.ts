import type { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Home,
  ShieldCheck,
  FileText,
  Inbox,
  Wallet,
  Building2,
  Search,
  ScrollText,
  Settings2,
  Users,
  BadgeCheck,
  Landmark,
} from "lucide-react";

export type NavItem = { id: string; label: string; href: string; icon: typeof Home };

export function navForRole(role: Role): NavItem[] {
  const base = (href: string): string => href;
  switch (role) {
    case "PARTNER":
      return [
        { id: "home", label: "Dashboard", href: "/partner", icon: LayoutDashboard },
        { id: "listings", label: "My listings", href: "/partner/listings", icon: Home },
        { id: "docs", label: "Compliance vault", href: "/partner/docs", icon: ShieldCheck },
        { id: "bookings", label: "Booking requests", href: "/partner/bookings", icon: Inbox },
        { id: "payouts", label: "Payouts", href: "/partner/payouts", icon: Wallet },
        { id: "accreditation", label: "Accreditation", href: "/partner/accreditation", icon: BadgeCheck },
      ];
    case "CLIENT":
      return [
        { id: "home", label: "Dashboard", href: "/client", icon: LayoutDashboard },
        { id: "browse", label: "Browse listings", href: "/client/browse", icon: Search },
        { id: "deployments", label: "Deployments", href: "/client/deployments", icon: Building2 },
        { id: "bookings", label: "Booking requests", href: "/client/bookings", icon: Inbox },
        { id: "invoices", label: "Invoices", href: "/client/invoices", icon: FileText },
        { id: "accreditation", label: "Approved vendors", href: "/client/accreditation", icon: BadgeCheck },
      ];
    case "ADMIN":
    case "STAFF":
      return [
        { id: "home", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { id: "listings", label: "Listing review", href: "/admin/listings", icon: Home },
        { id: "docs", label: "Document review", href: "/admin/docs", icon: ShieldCheck },
        { id: "deployments", label: "Deployments", href: "/admin/deployments", icon: Building2 },
        { id: "invoices", label: "Invoices", href: "/admin/invoices", icon: FileText },
        { id: "payouts", label: "Payouts", href: "/admin/payouts", icon: Wallet },
        { id: "accreditation", label: "Accreditations", href: "/admin/accreditation", icon: BadgeCheck },
        { id: "rates", label: "Take-rate config", href: "/admin/rates", icon: Settings2 },
        { id: "users", label: "Users & orgs", href: "/admin/users", icon: Users },
        { id: "audit", label: "Audit log", href: "/admin/audit", icon: ScrollText },
      ];
    default:
      return [{ id: "home", label: "Dashboard", href: base("/"), icon: Landmark }];
  }
}
