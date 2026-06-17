"use client";
import { loginFormUser } from '@/lib/actions/users';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { SubmitEvent, useActionState, useEffect, useState } from 'react'

type LoginActionState = {
    success: boolean;
    message: string;
    redirectTo?: string;
} | null;

const LoginForm = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [data, action] = useActionState<LoginActionState, FormData>(
        loginFormUser,
        null
    );

    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event: SubmitEvent) => {
        const user = username.trim();
        const pass = password.trim();

        if (!user || !pass) {
            event.preventDefault();
            setError("Username or email and password are required.");
            return;
        }

        setError("");
    };

    useEffect(() => {
        if(data?.success) {
            router.push(data.redirectTo || "/dashboard");
        }

    }, [data, router]);

    const displayError =
        error || (data?.success === false ? data.message : "");

    

    return (
        <form action={action}  className="space-y-4" onSubmit={handleSubmit}>
            {displayError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                    {displayError}
                </p>
            )}

            <div>
                <label className="text-sm text-gray-700">Username or Email</label>
                <input
                    type="text"
                    placeholder="admin or name@example.com"
                    name='username'
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1 px-4 py-2 rounded-lg bg-gray-100 border outline-none"
                />
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Password</label>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 underline-offset-2 hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <div className="relative mt-1">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        name='password'
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 border outline-none pr-10"
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                Sign In
            </button>

            {/* <div className="text-center text-sm text-gray-500">
                <Link
                    href="/trainee-login"
                    className="text-cyan-600 underline-offset-2 hover:underline"
                >
                    Trainee login
                </Link>
            </div> */}
        </form>
    )
}

export default LoginForm
