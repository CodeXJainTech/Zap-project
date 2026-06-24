"use client";

import { Appbar } from "@/components/Appbar";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { ZapCell } from "@/components/ZapCell";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/app/config";
import { Input } from "@/components/Input";

type AvailableItem = {
  id: string;
  name: string;
  image: string;
  metadata?: any;
};

const ACTIONS_WITH_CONFIG = ["email", "slack-action", "http-action"];
const TRIGGERS_WITH_CONFIG = ["schedule"];

function useAvailableActionsAndTriggers() {
  const [availableActions, setAvailableActions] = useState<AvailableItem[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<AvailableItem[]>(
    [],
  );
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/trigger/available`)
      .then((x) => setAvailableTriggers(x.data.availableTriggers))
      .catch(() => setLoadError(true));

    axios
      .get(`${BACKEND_URL}/api/v1/action/available`)
      .then((x) => setAvailableActions(x.data.availableActions))
      .catch(() => setLoadError(true));
  }, []);

  return { availableActions, availableTriggers, loadError };
}

export default function CreateZapPage() {
  const router = useRouter();
  const { availableActions, availableTriggers, loadError } =
    useAvailableActionsAndTriggers();

  const [selectedTrigger, setSelectedTrigger] = useState<AvailableItem>();
  const [selectedActions, setSelectedActions] = useState<
    {
      index: number;
      availableActionId: string;
      availableActionName: string;
      image: string;
      metadata: any;
    }[]
  >([]);
  const [selectedModalIndex, setSelectedModalIndex] = useState<null | number>(
    null,
  );
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedZap, setPublishedZap] = useState<{ id: string; secret: string; userId: string } | null>(null);

  // A zap is ready to publish when trigger is set and all action slots are filled
  const allActionsConfigured =
    selectedActions.length > 0 &&
    selectedActions.every((a) => a.availableActionId !== "");

  const canPublish = !!selectedTrigger?.id && allActionsConfigured;

  async function handlePublish() {
    if (!canPublish) {
      setPublishError(
        !selectedTrigger?.id
          ? "Please select a trigger first"
          : "Please configure all actions before publishing",
      );
      return;
    }
    setPublishing(true);
    setPublishError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/zap`,
        {
          availableTriggerId: selectedTrigger!.id,
          triggerMetadata: selectedTrigger!.metadata ?? {},
          actions: selectedActions.map((a) => ({
            availableActionId: a.availableActionId,
            actionMetadata: a.metadata,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      let uId = "YOUR_USER_ID";
      try {
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.id) uId = payload.id;
        }
      } catch (e) {}

      setPublishedZap({ id: res.data.zapId, secret: res.data.webhookSecret, userId: String(uId) });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Failed to publish. Please try again.";
      setPublishError(msg);
      setPublishing(false);
    }
  }

  const totalSteps = selectedActions.length + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Appbar />

      {/* sticky top bar */}
      <div className="flex items-center justify-between bg-white border-b px-6 py-3 sticky top-14.25 z-30 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Create Zap</h1>
          <p className="text-xs text-gray-400">
            {loadError
              ? "⚠️ Could not load triggers/actions — check backend connection"
              : !selectedTrigger
                ? "Start by choosing a trigger"
                : !allActionsConfigured
                  ? "Configure all actions before publishing"
                  : `${totalSteps} step${totalSteps !== 1 ? "s" : ""} ready`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PrimaryButton onClick={handlePublish} size="small">
            {publishing ? "Publishing…" : "Publish Zap ⚡"}
          </PrimaryButton>
          {publishError && (
            <p className="text-xs text-red-500">{publishError}</p>
          )}
        </div>
      </div>

      {/* canvas */}
      <div className="flex flex-col items-center py-12 px-4 gap-0">
        {/* trigger cell */}
        <ZapCell
          onClick={() => setSelectedModalIndex(1)}
          name={selectedTrigger?.name}
          image={selectedTrigger?.image}
          index={1}
          isLast={selectedActions.length === 0}
        />

        {/* action cells */}
        {selectedActions.map((action, idx) => (
          <ZapCell
            key={action.index}
            onClick={() => setSelectedModalIndex(action.index)}
            onRemove={() => {
              setSelectedActions((a) => {
                const newActions = [...a];
                newActions.splice(idx, 1);
                return newActions.map((act, i) => ({
                  ...act,
                  index: i + 2,
                }));
              });
            }}
            name={action.availableActionName || undefined}
            image={action.image || undefined}
            index={action.index}
            isLast={idx === selectedActions.length - 1}
          />
        ))}

        {/* add action */}
        <button
          onClick={() =>
            setSelectedActions((a) => [
              ...a,
              {
                index: a.length + 2,
                availableActionId: "",
                availableActionName: "",
                image: "",
                metadata: {},
              },
            ])
          }
          className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
        >
          <span className="text-lg leading-none">+</span> Add Action
        </button>
      </div>

      {/* modal */}
      {selectedModalIndex !== null && (
        <Modal
          availableItems={
            selectedModalIndex === 1 ? availableTriggers : availableActions
          }
          onSelect={(props) => {
            if (props === null) {
              setSelectedModalIndex(null);
              return;
            }
            if (selectedModalIndex === 1) {
              setSelectedTrigger({
                id: props.id,
                name: props.name,
                image: props.image,
                metadata: props.metadata,
              });
            } else {
              setSelectedActions((a) => {
                const next = [...a];
                next[selectedModalIndex - 2] = {
                  index: selectedModalIndex,
                  availableActionId: props.id,
                  availableActionName: props.name,
                  image: props.image,
                  metadata: props.metadata,
                };
                return next;
              });
            }
            setSelectedModalIndex(null);
          }}
          index={selectedModalIndex}
        />
      )}
      {/* Published Zap Modal */}
      {publishedZap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Zap Published! ⚡</h2>
            <p className="text-sm text-gray-600">
              Your zap is ready. You can trigger it easily by sending a POST request to this URL (the secret is included securely):
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Webhook URL (Easiest)</label>
              <div className="mt-1 bg-gray-50 p-3 rounded border text-sm font-mono break-all text-gray-800">
                http://localhost:3002/hooks/catch/{publishedZap.userId}/{publishedZap.id}?secret={publishedZap.secret}
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-2">
              <strong>Enterprise Mode:</strong> If you prefer to use HMAC-SHA256 headers (like GitHub does natively), use the base URL without the `?secret` parameter and pass the secret in the `x-zap-signature` or `x-hub-signature-256` header.
            </p>
            <div className="pt-4 flex justify-end">
              <PrimaryButton onClick={() => router.push("/dashboard")} size="big">
                Go to Dashboard
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal

function Modal({
  index,
  onSelect,
  availableItems,
}: {
  index: number;
  onSelect: (
    props: null | { name: string; id: string; image: string; metadata: any },
  ) => void;
  availableItems: AvailableItem[];
}) {
  const [step, setStep] = useState(0);
  const [selectedAction, setSelectedAction] = useState<AvailableItem>();
  const isTrigger = index === 1;

  function handleItemClick(item: AvailableItem) {
    if (isTrigger) {
      if (TRIGGERS_WITH_CONFIG.includes(item.id)) {
        setSelectedAction(item);
        setStep(1);
      } else {
        onSelect({ ...item, metadata: {} });
      }
      return;
    }
    if (ACTIONS_WITH_CONFIG.includes(item.id)) {
      setSelectedAction(item);
      setStep(1);
    } else {
      onSelect({ ...item, metadata: {} });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <div>
              <div className="font-bold text-gray-900">
                {step === 0
                  ? `Select ${isTrigger ? "Trigger" : "Action"}`
                  : `Configure ${selectedAction?.name}`}
              </div>
              {step === 1 && (
                <button
                  onClick={() => setStep(0)}
                  className="text-xs text-amber-600 hover:underline mt-0.5"
                >
                  ← Back
                </button>
              )}
            </div>
            <button
              onClick={() => onSelect(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* body */}
          <div className="p-4 max-h-[65vh] overflow-y-auto">
            {/* step 0: pick item */}
            {step === 0 && (
              <div className="space-y-1">
                {availableItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Loading…
                  </div>
                )}
                {availableItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                  >
                    {/* image with fallback */}
                    <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isTrigger ? "Trigger" : "Action"}
                        {!ACTIONS_WITH_CONFIG.includes(item.id) &&
                          !isTrigger &&
                          " · No config needed"}
                      </div>
                    </div>
                    <svg
                      className="ml-auto text-gray-300 shrink-0"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                    </svg>
                  </div>
                ))}
              </div>
            )}

            {/* step 1: configure */}
            {step === 1 && selectedAction && (
              <div className="pt-1">
                {selectedAction.id === "schedule" && (
                  <ScheduleSelector
                    setMetadata={(metadata) =>
                      onSelect({ ...selectedAction, metadata })
                    }
                  />
                )}
                {selectedAction.id === "email" && (
                  <EmailSelector
                    setMetadata={(metadata) =>
                      onSelect({ ...selectedAction, metadata })
                    }
                  />
                )}
                {selectedAction.id === "slack-action" && (
                  <SlackSelector
                    setMetadata={(metadata) =>
                      onSelect({ ...selectedAction, metadata })
                    }
                  />
                )}
                {selectedAction.id === "http-action" && (
                  <HttpSelector
                    setMetadata={(metadata) =>
                      onSelect({ ...selectedAction, metadata })
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metadata forms

function EmailSelector({ setMetadata }: { setMetadata: (p: any) => void }) {
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");

  return (
    <div className="space-y-3">
      <Input
        label="To"
        type="text"
        placeholder="recipient@example.com"
        onChange={(e) => setTo(e.target.value)}
      />
      <Input
        label="Body"
        type="text"
        placeholder="Use {triggerField} for dynamic values"
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="border-t pt-3 mt-1">
        <p className="text-xs text-gray-500 mb-2 font-medium">
          Your sender Gmail credentials —{" "}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            get app password ↗
          </a>
        </p>
        <Input
          label="Your Gmail address"
          type="text"
          placeholder="you@gmail.com"
          onChange={(e) => setFromEmail(e.target.value)}
        />
        <div className="mt-2">
          <Input
            label="Gmail App Password"
            type="password"
            placeholder="16-character app password"
            onChange={(e) => setAppPassword(e.target.value)}
          />
        </div>
      </div>
      <div className="pt-2">
        <PrimaryButton
          onClick={() =>
            setMetadata({ email: to, body, fromEmail, appPassword })
          }
        >
          Save & Add
        </PrimaryButton>
      </div>
    </div>
  );
}

function ScheduleSelector({ setMetadata }: { setMetadata: (p: any) => void }) {
  const [interval, setInterval] = useState("every-hour");
  const options = [
    { value: "every-5min", label: "Every 5 minutes" },
    { value: "every-15min", label: "Every 15 minutes" },
    { value: "every-hour", label: "Every hour" },
    { value: "every-6hours", label: "Every 6 hours" },
    { value: "every-day", label: "Every day at 9am" },
    { value: "every-week", label: "Every Monday at 9am" },
  ];
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm pb-1 pt-2 font-medium text-gray-600">
          Run interval
        </div>
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="border rounded px-4 py-2 w-full border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pt-2">
        <PrimaryButton onClick={() => setMetadata({ interval })}>
          Save & Add
        </PrimaryButton>
      </div>
    </div>
  );
}

function SlackSelector({ setMetadata }: { setMetadata: (p: any) => void }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border">
        Create an Incoming Webhook in your Slack workspace: Slack → Your apps →
        Incoming Webhooks → Add New Webhook
      </div>
      <Input
        label="Slack Webhook URL"
        type="text"
        placeholder="https://hooks.slack.com/services/..."
        onChange={(e) => setWebhookUrl(e.target.value)}
      />
      <Input
        label="Message"
        type="text"
        placeholder="Use {triggerField} for dynamic values"
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="pt-2">
        <PrimaryButton onClick={() => setMetadata({ webhookUrl, message })}>
          Save & Add
        </PrimaryButton>
      </div>
    </div>
  );
}

function HttpSelector({ setMetadata }: { setMetadata: (p: any) => void }) {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [body, setBody] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm pb-1 pt-2 font-medium text-gray-600">
          Method
        </div>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="border rounded px-4 py-2 w-full border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <Input
        label="URL"
        type="text"
        placeholder="https://api.example.com/endpoint"
        onChange={(e) => setUrl(e.target.value)}
      />
      {!["GET", "HEAD"].includes(method) && (
        <Input
          label="Body (JSON)"
          type="text"
          placeholder={`{"key": "{triggerField}"}`}
          onChange={(e) => setBody(e.target.value)}
        />
      )}
      <div className="pt-2">
        <PrimaryButton onClick={() => setMetadata({ url, method, body })}>
          Save & Add
        </PrimaryButton>
      </div>
    </div>
  );
}
