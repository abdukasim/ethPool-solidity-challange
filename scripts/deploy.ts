import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const weiAmount = (await deployer.getBalance()).toString();

  console.log(
    "Account balance:",
    (await ethers.utils.formatEther(weiAmount)) + " ETH"
  );

  const EthPool = await ethers.getContractFactory("EthPool");
  const ethPool = await EthPool.deploy();

  console.log("EthPool address:", ethPool.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
