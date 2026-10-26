"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { 
  Users, 
  Shield, 
  BookOpen, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  BarChart3
} from "lucide-react";

interface AdminStudent {
  id: string;
  name?: string | null;
  email: string;
  createdAt: string;
  isVerified: boolean;
  _count?: { roadmaps: number };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = (await res.json()) as { users?: AdminStudent[] };
        setUsers(data.users || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchUsers();
      }
    }
  }, [status, router, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", gap: "1rem", flexDirection: "column" }}>
        <Loader2 className="animate-spin text-primary" size={44} />
        <p className="text-muted text-sm">Verifying administrator credentials...</p>
      </div>
    );
  }

  // Aggregate metrics
  const totalStudents = users.length;
  const totalRoadmaps = users.reduce((acc, u) => acc + (u._count?.roadmaps || 0), 0);
  const averageRoadmapsPerStudent = totalStudents > 0 ? (totalRoadmaps / totalStudents).toFixed(1) : "0";

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="cyber-grid" />
      <Navbar />

      <main className="container" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link 
            href="/dashboard" 
            className="btn btn-ghost" 
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", gap: "0.4rem" }}
          >
            <ArrowLeft size={16} /> Return to Student Dashboard
          </Link>
        </div>

        {/* Admin Header */}
        <div 
          className="glass-card mb-8" 
          style={{ 
            padding: "2.5rem",
            background: "var(--card-gradient)",
            borderLeft: "4px solid var(--accent-emerald)"
          }}
        >
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div 
                className="badge badge-success mb-2" 
                style={{ fontSize: "0.75rem", gap: "0.35rem" }}
              >
                <Shield size={13} /> Administrative Control Panel
              </div>
              <h1 className="text-3xl mb-1">Student & Curriculum Management</h1>
              <p className="text-muted text-sm">
                Monitor student engagement, verify enrollment data, and review platform learning activity.
              </p>
            </div>

            <div 
              style={{ 
                padding: "0.75rem 1.25rem", 
                borderRadius: "var(--radius-md)", 
                background: "rgba(52, 211, 153, 0.1)", 
                border: "1px solid rgba(52, 211, 153, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem" 
              }}
            >
              <CheckCircle2 size={18} color="#34D399" />
              <span style={{ fontSize: "0.85rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                Owner & Staff Privileges Active
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid-3 mb-8">
          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Total Enrolled</span>
              <Users size={20} color="#60A5FA" />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {totalStudents}
            </div>
            <div className="text-muted text-xs mt-2">Verified active student accounts</div>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Generated Roadmaps</span>
              <BookOpen size={20} color="#A78BFA" />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent-secondary)" }}>
              {totalRoadmaps}
            </div>
            <div className="text-muted text-xs mt-2">Active curriculum journeys across subjects</div>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div className="flex-between mb-2">
              <span className="text-muted text-xs" style={{ textTransform: "uppercase", fontWeight: 700 }}>Avg Journeys / Scholar</span>
              <BarChart3 size={20} color="#34D399" />
            </div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
              {averageRoadmapsPerStudent}
            </div>
            <div className="text-muted text-xs mt-2">High student engagement index</div>
          </div>
        </div>

        {/* Registered Students Data Table */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <div className="flex-between mb-6" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className="text-2xl mb-1">Registered Student Scholars</h2>
              <p className="text-muted text-sm">Real-time student registry directly connected to SQLite database.</p>
            </div>

            <div className="form-input-wrapper" style={{ maxWidth: "320px" }}>
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="form-input" 
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>Scholar</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>Date Joined</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>Roadmaps</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.2s ease" 
                    }}
                  >
                    <td style={{ padding: "1.2rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div 
                          style={{ 
                            width: "36px", 
                            height: "36px", 
                            borderRadius: "50%", 
                            background: "linear-gradient(135deg, #60A5FA, #A78BFA)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: "#080B18",
                            fontWeight: 700,
                            fontSize: "0.85rem"
                          }}
                        >
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {user.name || "Anonymous Scholar"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1.2rem 1.25rem", color: "var(--accent-primary)", fontSize: "0.9rem" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "1.2rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td style={{ padding: "1.2rem 1.25rem" }}>
                      <span className="badge badge-purple" style={{ fontSize: "0.8rem" }}>
                        {user._count?.roadmaps || 0} Roadmaps
                      </span>
                    </td>
                    <td style={{ padding: "1.2rem 1.25rem" }}>
                      <span className="badge badge-success" style={{ fontSize: "0.75rem", gap: "0.3rem" }}>
                        <CheckCircle2 size={12} /> Active
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                      {searchQuery ? "No students matching your search criteria." : "No registered students in the system yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
