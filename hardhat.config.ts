require("dotenv").config();

// Plugins

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@tenderly/hardhat-tenderly";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "solidity-coverage";

import { task } from "hardhat/config";
import { Contract, utils } from "ethers";

interface GetBalanceParams {
  contract: string;
}

task("getBalance", "Gets the ETH balance of a contract")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs: GetBalanceParams, hre) => {
    const contractAddress = taskArgs.contract;

    const contract = await hre.ethers.getContractAt(
      "ContractABI",
      contractAddress
    );

    const balance = await hre.ethers.provider.getBalance(contractAddress);

    console.log(
      `Balance of ${contractAddress}: ${utils.formatEther(balance)} ETH`
    );
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.15",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
