"use client"

import { useState } from "react"
import CopyButton from "@/components/CopyButton"

const GUIDES = [
  {
    id: "followupboss",
    name: "Follow Up Boss",
    steps: (url: string) => [
      "In Follow Up Boss, go to Admin → API.",
      "Under Outbound Webhooks, click Add Webhook.",
      `Set the URL to: ${url}`,
      "Select the Lead Created event and save.",
    ],
  },
  {
    id: "kvcore",
    name: "kvCORE",
    steps: (url: string) => [
      "Go to your kvCORE Marketplace → Lead Routing.",
      'Add a new "3rd Party Integration" with type Webhook.',
      `Enter the endpoint URL: ${url}`,
      "Save and test with a dummy lead.",
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    steps: (url: string) => [
      "In HubSpot, open Settings → Integrations → Webhooks.",
      'Click "Create webhook" and select Contact created.',
      `Set the target URL to: ${url}`,
      "Lead Hook normalizes HubSpot's contact format automatically.",
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    steps: (url: string) => [
      "Use Salesforce Flow or Process Builder to trigger on Lead Created.",
      "Add an HTTP Callout step (or use a Connected App).",
      `Set the endpoint to: ${url}`,
      "Map FirstName, LastName, Email, Phone fields in the request body.",
    ],
  },
  {
    id: "boomtown",
    name: "BoomTown",
    steps: (url: string) => [
      "In BoomTown, open Settings → Integrations → Lead Routing.",
      "Add a webhook destination for new leads.",
      `Set the URL to: ${url}`,
      "BoomTown sends lead_name / lead_email / lead_phone — handled automatically.",
    ],
  },
  {
    id: "sierra",
    name: "Sierra Interactive",
    steps: (url: string) => [
      "In Sierra, go to Settings → Lead Routing → Webhook.",
      'Click "Add Webhook" and set it to fire on new lead registration.',
      `Endpoint URL: ${url}`,
      "Sierra sends first_name, last_name, email, phone — handled automatically.",
    ],
  },
  {
    id: "facebook",
    name: "Facebook / Meta Ads",
    steps: (url: string) => [
      "Use Meta Business Suite → Lead Center → Integrations.",
      "Or use Zapier to forward Facebook Lead Ads to Lead Hook.",
      `If using a direct webhook, set the URL to: ${url}`,
      "Lead Hook reads ad_name as the lead source automatically.",
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    steps: (url: string) => [
      "Create a new Zap with your lead source as the trigger.",
      'Add a "Webhooks by Zapier" action → POST.',
      `Set the URL to: ${url}`,
      "Map name (or first_name + last_name), phone, email, and source fields.",
    ],
  },
  {
    id: "custom",
    name: "Custom Webhook / Form",
    steps: (url: string) => [
      `POST JSON to: ${url}`,
      "Required fields: name (or first_name + last_name), phone, email.",
      "Optional: source (e.g. 'Website Form', 'Zillow').",
      "Lead Hook will create the lead and fire an instant SMS.",
    ],
  },
]

export default function WebhookSection({ webhookUrl }: { webhookUrl: string }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Lead Intake Webhook</h2>
        <p className="text-xs text-gray-400 mb-4">
          Point any CRM or form tool at this URL to send leads directly into Lead Hook.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <code className="flex-1 text-sm text-gray-800 break-all">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Integration Guides
        </h3>
        <div className="space-y-1">
          {GUIDES.map((guide) => (
            <div key={guide.id} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === guide.id ? null : guide.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left"
              >
                {guide.name}
                <span className="text-gray-300 text-xs">{open === guide.id ? "▲" : "▼"}</span>
              </button>
              {open === guide.id && (
                <div className="px-4 pb-4">
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
                    {guide.steps(webhookUrl).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
