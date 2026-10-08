"use client";

import { useState } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container flex-center">
        <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-center mb-4">Create Account</h2>
          {error && <div className="text-error mb-4 text-center">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign Up</button>
          
          <p className="text-center mt-4" style={{ color: '#94a3b8' }}>
            Already have an account? <Link href="/login" style={{ color: '#3b82f6' }}>Login</Link>
          </p>
        </form>
      </div>
    </>
  );
}
