const Contract = require("../model/Contract");
const User = require("../model/User");
const { awardXP } = require("./gamificationService");

/**
 * Creates a new goal commitment contract.
 */
async function createContract(userId, goalData) {
  const { goalId, title, deadline, commitmentLevel } = goalData;

  const contract = new Contract({
    userId,
    goalId,
    title,
    deadline: new Date(deadline),
    commitmentLevel: commitmentLevel || "firm",
    penaltyXP: commitmentLevel === "unbreakable" ? 250 : 100,
    rewardXP: commitmentLevel === "unbreakable" ? 500 : 250,
  });

  await contract.save();
  return contract;
}

/**
 * Processes a daily/weekly check-in for a contract.
 */
async function processCheckIn(contractId, checkInData) {
  const { status, note } = checkInData;
  const contract = await Contract.findById(contractId);
  if (!contract) throw new Error("Contract not found");

  contract.checkIns.push({
    status,
    note,
    date: new Date(),
  });
  contract.lastCheckIn = new Date();

  await contract.save();
  return contract;
}

/**
 * Finalizes a contract based on its deadline and progress.
 */
async function finalizeContract(contractId) {
  const contract = await Contract.findById(contractId);
  if (!contract || contract.status !== "active") return null;

  const now = new Date();
  const isExpired = now > contract.deadline;
  
  // Basic logic: if 80%+ check-ins are 'completed', contract succeeds
  const completedCheckIns = contract.checkIns.filter(c => c.status === "completed").length;
  const totalRequired = 5; // Placeholder requirement
  
  if (completedCheckIns >= totalRequired) {
    contract.status = "completed";
    await awardXP(contract.userId, contract.rewardXP);
  } else if (isExpired) {
    contract.status = "failed";
    await awardXP(contract.userId, -contract.penaltyXP);
  }

  await contract.save();
  return contract;
}

module.exports = {
  createContract,
  processCheckIn,
  finalizeContract,
};
