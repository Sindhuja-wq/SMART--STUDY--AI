"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LogOut, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand flex-center" style={{ gap: '0.5rem' }}>
        <BookOpen size={24} color="#3b82f6" />
        Smart Study AI
      </Link>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {session ? (
          <>
            <Link href="/dashboard" className="btn btn-outline">Dashboard</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <User size={18} />
              {session.user?.email}
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-primary flex-center" style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-outline">Login</Link>
            <Link href="/register" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
