"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <>
      <Navbar />
      <div className="container flex-center">
        <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-center mb-4">Welcome Back</h2>
          {error && <div className="text-error mb-4 text-center">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
          
          <p className="text-center mt-4" style={{ color: '#94a3b8' }}>
            Don't have an account? <Link href="/register" style={{ color: '#3b82f6' }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </>
  );
}
