import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Supabase setup
const supabase = createClient(
  "https://mhtfjfvcrwfuucukorvb.supabase.co",
  "YOUR_SERVICE_ROLE_KEY" // ⚠️ use service role key here
);

// DC site (example page)
const DC_URL = "https://www.commissionerkarachi.gos.pk/karachi/pricelist";

async function fetchAndSave() {
  try {
    console.log("🔄 Checking DC Price List...");

    // 1. Fetch page HTML
    const res = await fetch(DC_URL);
    const html = await res.text();

    // 2. Extract PDF link (simple regex)
    const pdfMatch = html.match(/https?:\/\/[^"]+\.pdf/g);

    if (!pdfMatch || pdfMatch.length === 0) {
      console.log("❌ No PDF found");
      return;
    }

    const latestPDF = pdfMatch[0];

    console.log("📄 Found PDF:", latestPDF);

    // 3. Insert into Supabase
    const { data, error } = await supabase
      .from("pdf_sources")
      .insert([
        {
          title: "DC Daily Price List",
          file_url: latestPDF,
          status: "downloaded",
        },
      ]);

    if (error) {
      console.error("Supabase Error:", error);
      return;
    }

    console.log("✅ Saved to Supabase:", data);

  } catch (err) {
    console.error("Error:", err);
  }
}

// Run script
fetchAndSave();
