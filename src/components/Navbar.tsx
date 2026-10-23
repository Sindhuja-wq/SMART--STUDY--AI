"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LogOut, Sparkles, Shield, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link href="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <BookOpen size={20} color="#60A5FA" />
          </div>
          <span className="brand-text">Smart Study AI</span>
          <span className="brand-badge">PRO</span>
        </Link>

        {session && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link 
              href="/dashboard" 
              className="btn btn-ghost" 
              style={{ fontSize: "0.9rem", padding: "0.5rem 0.9rem", gap: "0.4rem" }}
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="btn btn-ghost" 
                style={{ fontSize: "0.9rem", padding: "0.5rem 0.9rem", gap: "0.4rem", color: "var(--accent-emerald)" }}
              >
                <Shield size={16} /> Admin
              </Link>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
        <ThemeToggle />
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.6rem", 
                background: "rgba(17, 23, 43, 0.7)", 
                padding: "0.4rem 0.85rem", 
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-subtle)" 
              }}
            >
              <div 
                style={{ 
                  width: "28px", 
                  height: "28px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, #60A5FA, #A78BFA)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#080B18",
                  fontWeight: 700,
                  fontSize: "0.8rem"
                }}
              >
                {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-main)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user?.name || session.user?.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="badge badge-success" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                  ADMIN
                </span>
              )}
            </div>

            <button 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className="btn btn-outline" 
              style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem", color: "var(--accent-rose)", borderColor: "rgba(248, 113, 113, 0.25)" }}
              title="Log out"
            >
              <LogOut size={15} />
              <span style={{ display: "inline" }}>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <Link href="/login" className="btn btn-outline" style={{ padding: "0.55rem 1.1rem", fontSize: "0.9rem" }}>
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.55rem 1.15rem", fontSize: "0.9rem" }}>
              <Sparkles size={15} /> Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
