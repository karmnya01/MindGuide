const cron = require("node-cron");
const User = require("../model/User");
const { generateInsight, sendInsightEmail } = require("./insightService");

const BATCH_SIZE = 10; // Process users in batches to avoid blocking the event loop

/**
 * Process all users in batches, generating and emailing weekly insights.
 * Errors for individual users are caught and logged without stopping other users.
 */
async function processWeeklyInsights() {
  console.log("[Cron] Starting weekly insight generation...");

  let skip = 0;
  let processed = 0;
  let batch;

  do {
    batch = await User.find({}).select("_id name email").skip(skip).limit(BATCH_SIZE).lean();

    const tasks = batch.map(async (user) => {
      try {
        const insight = await generateInsight(user._id, user.name);
        await sendInsightEmail(user.email, user.name, insight);
        console.log(`[Cron] Insight sent to ${user.email}`);
        processed++;
      } catch (err) {
        console.error(`[Cron] Failed for user ${user.email}:`, err.message);
      }
    });

    // Process batch concurrently but wait before moving to next batch
    await Promise.allSettled(tasks);
    skip += BATCH_SIZE;
  } while (batch.length === BATCH_SIZE);

  console.log(`[Cron] Weekly insights complete. Processed: ${processed} users.`);
}

/**
 * Schedule: Every Monday at 8:00 AM server time (UTC).
 * Format: second minute hour day-of-month month day-of-week
 */
const { finalizeContract } = require("./contractService");
const Contract = require("../model/Contract");

// ... (other functions)

async function checkExpiredContracts() {
  console.log("[Cron] Checking for expired contracts...");
  const activeContracts = await Contract.find({ status: "active" });
  for (const contract of activeContracts) {
    try {
      await finalizeContract(contract._id);
    } catch (err) {
      console.error(`[Cron] Finalize failed for ${contract._id}:`, err.message);
    }
  }
}

function startCronJobs() {
  // Wednesday at 10:55 PM IST (17:25 UTC)
  // Format: minute hour day month day-of-week
  cron.schedule("25 17 * * 3", processWeeklyInsights, {
    timezone: "UTC",
  });
  console.log("[Cron] Weekly insight scheduler registered (Wed 17:25 UTC / 10:55 PM IST).");

  cron.schedule("25 17 * * 3", checkExpiredContracts, {
    timezone: "UTC",
  });
  console.log("[Cron] Contract check-in scheduler registered (Wed 17:25 UTC / 10:55 PM IST).");
}

module.exports = { startCronJobs, processWeeklyInsights, checkExpiredContracts };

