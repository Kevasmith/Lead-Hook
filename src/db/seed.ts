import { db } from "./index"
import { leads, activities } from "./schema"

async function seed() {
  console.log("Seeding database...")

  const inserted = await db
    .insert(leads)
    .values([
      {
        name: "James Carter",
        phone: "+15550001111",
        email: "james.carter@example.com",
        source: "Facebook Ads",
        status: "replied",
        lastContactedAt: new Date(),
      },
      {
        name: "Maria Santos",
        phone: "+15550002222",
        email: "maria.santos@example.com",
        source: "Website Form",
        status: "new",
      },
      {
        name: "David Kim",
        phone: "+15550003333",
        email: "david.kim@example.com",
        source: "Facebook Ads",
        status: "contacted",
        lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        name: "Priya Nair",
        phone: "+15550004444",
        email: "priya.nair@example.com",
        source: "Referral",
        status: "new",
      },
      {
        name: "Tom Bridges",
        phone: "+15550005555",
        email: "tom.bridges@example.com",
        source: "Zillow",
        status: "closed",
      },
    ])
    .returning()

  await db.insert(activities).values([
    { leadId: inserted[0].id, type: "sms", outcome: "sent" },
    { leadId: inserted[0].id, type: "sms", outcome: "replied" },
    { leadId: inserted[1].id, type: "sms", outcome: "sent" },
    { leadId: inserted[2].id, type: "sms", outcome: "sent" },
    { leadId: inserted[2].id, type: "sms", outcome: "sent" },
  ])

  console.log(`Seeded ${inserted.length} leads.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
