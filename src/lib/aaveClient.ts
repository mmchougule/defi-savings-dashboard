import { AaveClient } from "@aave/react";

export const aaveClient = AaveClient.create({
  // Use the official Aave v3 pool address for Ethereum mainnet
  poolAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
});
