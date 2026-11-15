const { clerkClient } = require("@clerk/express");
const UserModel = require("../model/User");

const syncClerkUser = async (clerkId) => {
  const existingUser = await UserModel.findOne({ clerkId });
  if (existingUser) return existingUser;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const emailAddresses = clerkUser.emailAddresses || [];
  const email =
    emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Clerk account does not have a verified email address");
  }

  const name =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
    clerkUser.username ||
    email.split("@")[0];

  try {
    return await UserModel.create({
      clerkId,
      name,
      email,
      pic: clerkUser.imageUrl,
      password: "clerk_oauth_user",
    });
  } catch (error) {
    if (error.code !== 11000) throw error;

    const syncedUser = await UserModel.findOne({ clerkId });
    if (syncedUser) return syncedUser;
    throw error;
  }
};

module.exports = { syncClerkUser };
