"use client";
import { Appbar } from "@/components/Appbar";
import { DarkButton } from "@/components/buttons/DarkButton";
import axios from "axios";
import { useEffect, useState } from "react";
import { BACKEND_URL, HOOKS_URL } from "../config";
import { useRouter } from "next/navigation";

interface Zap {
  id: string;
  triggerId: string;
  userId: number;
  actions: {
    id: string;
    zapId: string;
    actionId: string;
    sortingOrder: number;
    type: { id: string; name: string; image: string };
  }[];
  trigger: {
    id: string;
    zapId: string;
    triggerId: string;
    type: { id: string; name: string; image: string };
  };
}

function useZaps() {
  const [loading, setLoading] = useState(true);
  const [zaps, setZaps] = useState<Zap[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // decode userId from JWT payload — avoids an extra API call
    try {
      const payload = JSON.parse(atob(token!.split(".")[1]));
      setUserId(payload.id);
    } catch {}

    axios
      .get(`${BACKEND_URL}/api/v1/zap`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setZaps(res.data.zaps);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { loading, zaps, userId };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function ZapRow({ zap, userId }: { zap: Zap; userId: number | null }) {
  const webhookUrl = `${HOOKS_URL}/hooks/catch/${userId ?? zap.userId}/${zap.id}`;
  const createdAt = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="grid grid-cols-12 gap-4 items-center border-b py-4 px-4 hover:bg-amber-50/40 transition-colors last:border-0">
      {/* app icons */}
      <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
        <img
          src={zap.trigger.type.image}
          className="w-8 h-8 rounded-lg border border-gray-200 object-contain bg-white p-0.5"
          title={zap.trigger.type.name}
        />
        {zap.actions.map((x) => (
          <span key={x.id} className="flex items-center gap-1">
            <span className="text-gray-300 text-xs">›</span>
            <img
              src={x.type.image}
              className="w-8 h-8 rounded-lg border border-gray-200 object-contain bg-white p-0.5"
              title={x.type.name}
            />
          </span>
        ))}
      </div>
      {/* flow label */}
      <div className="col-span-3 text-sm font-medium text-gray-800 truncate">
        {zap.trigger.type.name}
        {zap.actions.length > 0 && (
          <span className="text-gray-400 font-normal">
            {" › "}
            {zap.actions.map((a) => a.type.name).join(" › ")}
          </span>
        )}
      </div>
      {/* short id */}
      <div className="col-span-2 text-xs text-gray-400 font-mono" title={zap.id}>
        {zap.id.slice(0, 8)}…
      </div>
      {/* date */}
      <div className="col-span-1 text-xs text-gray-500 whitespace-nowrap">{createdAt}</div>
      {/* webhook url + copy */}
      <div className="col-span-4 flex items-center min-w-0">
        <span className="text-xs text-gray-500 font-mono truncate" title={webhookUrl}>
          {webhookUrl}
        </span>
        <CopyButton text={webhookUrl} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { loading, zaps, userId } = useZaps();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Appbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Zaps</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading…"
                : `${zaps.length} automation${zaps.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <DarkButton onClick={() => router.push("/zap/create")}>
            + Create Zap
          </DarkButton>
        </div>

        {/* content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : zaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="text-5xl mb-4">⚡</div>
            <div className="text-lg font-semibold text-gray-700">No zaps yet</div>
            <div className="text-gray-400 text-sm mt-1 mb-6">
              Create your first automation to get started
            </div>
            <DarkButton onClick={() => router.push("/zap/create")}>
              + Create your first Zap
            </DarkButton>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* table header */}
            <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Apps</div>
              <div className="col-span-3">Flow</div>
              <div className="col-span-2">ID</div>
              <div className="col-span-1">Created</div>
              <div className="col-span-4">Webhook URL</div>
            </div>
            {zaps.map((z) => (
              <ZapRow key={z.id} zap={z} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}