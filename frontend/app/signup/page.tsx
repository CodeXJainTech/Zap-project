"use client";
import { Appbar } from "@/components/Appbar";
import { CheckFeature } from "@/components/CheckFeature";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import axios from "axios";
import { useState } from "react";
import { BACKEND_URL } from "../config";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div>
      <Appbar />
      <div className="flex justify-center">
        <div className="flex pt-8 max-w-4xl">
          <div className="flex-1 pt-20 px-4">
            <div className="font-semibold text-3xl pb-4">
              Join and try it.
            </div>
            <div className="pb-6 pt-4">
              <CheckFeature label={"Easy setup, no coding required"} />
            </div>
            <div className="pb-6">
              <CheckFeature label={"Free forever for core features"} />
            </div>
            <CheckFeature label={"14-day trial of premium features & apps"} />
          </div>
          <div className="flex-1 pt-6 pb-6 mt-12 px-4 border rounded">
            <Input
              label={"Name"}
              onChange={(e) => {
                setName(e.target.value);
              }}
              type="text"
              placeholder="Your name"
            ></Input>
            <Input
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              label={"Email"}
              type="text"
              placeholder="Your Email"
            ></Input>
            <Input
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              label={"Password"}
              type="password"
              placeholder="Password"
            ></Input>

            <div className="pt-4">
              <PrimaryButton
                onClick={async () => {
                  try {
                    setError("");
                    if (name.trim().length < 3) {
                      setError("Name must be at least 3 characters");
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                      setError("Invalid email address");
                      return;
                    }
                    if (password.length < 6) {
                      setError("Password must be at least 6 characters");
                      return;
                    }
                    const res = await axios.post(
                      `${BACKEND_URL}/api/v1/user/signup`,
                      {
                        username: email,
                        password,
                        name,
                      },
                    );
                    if (res.status === 200 || res.status === 201) {
                      router.push("/login");
                    }
                  } catch (err: any) {
                    setError(err.response?.data?.message || "An unexpected error occurred");
                  }
                }}
                size="big"
              >
                Get started free
              </PrimaryButton>
              {error && <div className="text-red-500 pt-4 text-sm">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}