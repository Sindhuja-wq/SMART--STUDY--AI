"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Users } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if ((session.user as any).role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchUsers();
      }
    }
  }, [status, router, session]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  };

  if (status === "loading" || loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <>
      <Navbar />
      <main className="container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }} className="flex-center">
          <Users size={32} style={{ marginRight: '1rem', color: '#10b981' }} />
          Admin Dashboard
        </h1>

        <div className="glass-card">
          <h2 className="mb-4">Registered Students</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Joined</th>
                  <th style={{ padding: '1rem' }}>Total Roadmaps</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{user.name || "N/A"}</td>
                    <td style={{ padding: '1rem', color: '#3b82f6' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{user._count.roadmaps}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                      No students registered yet.
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
