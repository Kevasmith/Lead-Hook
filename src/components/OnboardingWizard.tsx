"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type WorkspaceType = "business" | "personal"

const TOTAL_STEPS = 4

async function saveStep(data: Record<string, unknown>) {
  await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-600 transition-all duration-500"
        style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = "text", hint, link,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  hint?: string
  link?: { label: string; href: string }
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {link && (
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            {link.label} →
          </a>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
      />
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

function NavButtons({
  onBack, onNext, nextLabel = "Continue", disabled = false, saving = false, showSkip = false, onSkip,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
  saving?: boolean
  showSkip?: boolean
  onSkip?: () => void
}) {
  return (
    <div className="flex items-center gap-3 mt-8">
      {onBack && (
        <button type="button" onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          Back
        </button>
      )}
      <button onClick={onNext} disabled={disabled || saving}
        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition">
        {saving ? "Saving…" : nextLabel}
      </button>
      {showSkip && (
        <button type="button" onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition px-2">
          Skip
        </button>
      )}
    </div>
  )
}

export default function OnboardingWizard({ webhookUrl }: { webhookUrl: string }) {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)

  // Step 0 — Welcome
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(null)
  const [name, setName]                   = useState("")

  // Step 1 — SMS
  const [twilioSid,    setTwilioSid]    = useState("")
  const [twilioToken,  setTwilioToken]  = useState("")
  const [twilioNumber, setTwilioNumber] = useState("")

  // Step 2 — AI + Email
  const [openaiKey,      setOpenaiKey]      = useState("")
  const [resendKey,      setResendKey]      = useState("")
  const [resendFromEmail, setResendFromEmail] = useState("")

  // Step 3 — Webhook (copy + finish)
  const [copied, setCopied] = useState(false)
  const [openGuide, setOpenGuide] = useState<string | null>(null)

  async function go(data: Record<string, unknown>, nextStep: number) {
    setSaving(true)
    try {
      await saveStep(data)
      setStep(nextStep)
    } finally {
      setSaving(false)
    }
  }

  async function finish() {
    setSaving(true)
    try {
      await saveStep({ complete: true })
      toast.success("You're all set — welcome to Lead Hook!")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const GUIDES = [
    { id: "followupboss", name: "Follow Up Boss",
      steps: [`Go to Admin → API → Outbound Webhooks → Add Webhook.`, `Set URL to: ${webhookUrl}`, "Select Lead Created event and save."] },
    { id: "zapier", name: "Zapier",
      steps: [`Create a Zap with your lead source as the trigger.`, `Add "Webhooks by Zapier" → POST.`, `Set URL to: ${webhookUrl}`, "Map name, phone, email, source fields."] },
    { id: "facebook", name: "Facebook / Meta Ads",
      steps: ["Use Zapier or Meta's CRM integration to forward leads.", `Set the webhook URL to: ${webhookUrl}`, "Lead Hook reads ad_name as the source automatically."] },
    { id: "custom", name: "Custom / Any Form",
      steps: [`POST JSON to: ${webhookUrl}`, "Required: name (or first_name + last_name), phone, email.", "Optional: source (e.g. 'Website Form').", "Lead Hook creates the lead and fires an instant SMS."] },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">Lead Hook</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <ProgressBar step={step} />

          <div className="p-8">
            <p className="text-xs font-medium text-gray-400 mb-6 uppercase tracking-wide">
              Step {step + 1} of {TOTAL_STEPS}
            </p>

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to Lead Hook</h1>
                <p className="text-sm text-gray-500 mb-7">How will you be using Lead Hook?</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { type: "business", icon: "🏢", title: "Business", desc: "Agency, team, or brokerage" },
                    { type: "personal", icon: "👤", title: "Personal",  desc: "Individual agent" },
                  ] as const).map(({ type, icon, title, desc }) => (
                    <button key={type} type="button" onClick={() => setWorkspaceType(type)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        workspaceType === type
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="font-semibold text-gray-900 text-sm">{title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>

                <Field
                  label={workspaceType === "business" ? "Business / Agency Name" : "Your Name"}
                  value={name}
                  onChange={setName}
                  placeholder={workspaceType === "business" ? "e.g. Smith Realty Group" : "e.g. Kevin Smith"}
                />

                <NavButtons
                  onNext={() => go({ workspaceType, businessName: name }, 1)}
                  disabled={!workspaceType}
                  saving={saving}
                  nextLabel="Get Started"
                />
              </div>
            )}

            {/* ── Step 1: SMS / Twilio ── */}
            {step === 1 && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#3b82f6" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Enable SMS</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Twilio sends instant texts to new leads and receives their replies.
                </p>

                <div className="space-y-4">
                  <Field label="Account SID" value={twilioSid} onChange={setTwilioSid}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="text"
                    hint="Starts with AC — found on your Twilio Console dashboard"
                    link={{ label: "Open Twilio Console", href: "https://console.twilio.com" }} />
                  <Field label="Auth Token" value={twilioToken} onChange={setTwilioToken}
                    placeholder="Your Twilio auth token" type="password"
                    hint="Found next to your Account SID" />
                  <Field label="From Number" value={twilioNumber} onChange={setTwilioNumber}
                    placeholder="+1xxxxxxxxxx" type="text"
                    hint="Your Twilio phone number in E.164 format" />
                </div>

                <NavButtons
                  onBack={() => setStep(0)}
                  onNext={() => go({ twilioAccountSid: twilioSid, twilioAuthToken: twilioToken, twilioFromNumber: twilioNumber }, 2)}
                  saving={saving}
                  showSkip
                  onSkip={() => setStep(2)}
                />
              </div>
            )}

            {/* ── Step 2: AI + Email ── */}
            {step === 2 && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#8b5cf6" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">AI &amp; Email</h2>
                <p className="text-sm text-gray-500 mb-6">
                  OpenAI writes personalised messages. Resend handles follow-up emails.
                </p>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">OpenAI</p>
                    <Field label="API Key" value={openaiKey} onChange={setOpenaiKey}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxx" type="password"
                      link={{ label: "Get your key", href: "https://platform.openai.com/api-keys" }} />
                  </div>

                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resend</p>
                    <Field label="API Key" value={resendKey} onChange={setResendKey}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxx" type="password"
                      link={{ label: "Get your key", href: "https://resend.com/api-keys" }} />
                    <Field label="From Address" value={resendFromEmail} onChange={setResendFromEmail}
                      placeholder="you@yourdomain.com" type="email"
                      hint="Must be from a verified domain in Resend" />
                  </div>
                </div>

                <NavButtons
                  onBack={() => setStep(1)}
                  onNext={() => go({ openaiApiKey: openaiKey, resendApiKey: resendKey, resendFromEmail }, 3)}
                  saving={saving}
                  showSkip
                  onSkip={() => setStep(3)}
                />
              </div>
            )}

            {/* ── Step 3: Connect Lead Sources ── */}
            {step === 3 && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#22c55e" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Connect Your Lead Sources</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Point any CRM or form tool at your webhook to start capturing leads automatically.
                </p>

                {/* Webhook URL */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
                  <code className="flex-1 text-sm text-gray-800 break-all">{webhookUrl}</code>
                  <button type="button" onClick={copyWebhook}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Platform guides */}
                <div className="space-y-1.5">
                  {GUIDES.map((g) => (
                    <div key={g.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition">
                        {g.name}
                        <span className="text-gray-300 text-xs">{openGuide === g.id ? "▲" : "▼"}</span>
                      </button>
                      {openGuide === g.id && (
                        <div className="px-4 pb-4">
                          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
                            {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <NavButtons
                  onBack={() => setStep(2)}
                  onNext={finish}
                  nextLabel="Go to Dashboard"
                  saving={saving}
                />
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          You can update any of these settings later in the Settings page.
        </p>
      </div>
    </div>
  )
}
