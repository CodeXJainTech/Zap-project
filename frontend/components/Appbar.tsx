"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const Appbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Re-check token whenever the route changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <div className="flex border-b justify-between px-6 py-3 items-center bg-white sticky top-0 z-40 shadow-sm">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => router.push("/")}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xl font-black tracking-tight text-gray-900">Zap</span>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
            >
              Sign up free
            </button>
          </>
        )}
      </div>
    </div>
  );
};