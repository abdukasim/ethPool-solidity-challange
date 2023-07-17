import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { waffleChai } from "@ethereum-waffle/chai";

import { EthPool, EthPool__factory } from "../build/types";

const { getContractFactory, getSigners } = ethers;

describe("EthPool", () => {
  let ethPool: EthPool;
  let owner, team, addr1, addr2;

  const toWEI = (eth) => ethers.utils.parseEther(eth);

  beforeEach(async () => {
    const signers = await getSigners();
    owner = signers[0];
    addr1 = signers[1];
    addr2 = signers[2];
    team = signers[3];

    const ethPoolFactory = (await getContractFactory(
      "EthPool",
      owner
    )) as EthPool__factory;
    ethPool = await ethPoolFactory.deploy();
    await ethPool.deployed();
    const initialBalance = await ethPool.getBalance();

    expect(initialBalance).to.eq(0);
    // expect(ethPool.address).to.properAddress
  });

  it("should deposit", async () => {
    await ethPool.depositEth({ value: 100 });
    const balance = await ethPool.getBalance();
    expect(balance).to.eq(100);
  });

  it("should allow team members to deposit rewards", async () => {
    await ethPool.addTeamMember(team.address);
    await ethPool.connect(team).depositRewards({ value: 100 });
    const rewardsPool = await ethPool.getRewardsPool();
    expect(rewardsPool).to.eq(100);
  });

  it("should allow team to deposit rewards only once a week", async () => {
    await ethPool.addTeamMember(team.address);
    await ethPool.connect(team).depositRewards({ value: 100 });
    await expect(
      ethPool.connect(team).depositRewards({ value: 100 })
    ).to.be.revertedWith("Rewards can only be deposited once per week.");
  });

  it("should give all depositers the same percentage of rewards if they deposited the same amount", async () => {
    await ethPool.connect(addr1).depositEth({ value: 1 });
    await ethPool.connect(addr2).depositEth({ value: 1 });
    await ethPool.addTeamMember(team.address);
    await ethPool.connect(team).depositRewards({ value: 10 });
    const addr1Rewards = await ethPool.getUserReward(addr1.address);
    const addr2Rewards = await ethPool.getUserReward(addr2.address);
    expect(addr1Rewards).to.eq(5);
    expect(addr1Rewards).to.eq(addr2Rewards);
  });

  it("should give all depositers the appropriate percentage of rewards depending on their deposit amount. A, B, T", async () => {
    await ethPool.connect(addr1).depositEth({ value: toWEI("100") });
    await ethPool.connect(addr2).depositEth({ value: toWEI("300") });
    await ethPool.addTeamMember(team.address);
    await ethPool.connect(team).depositRewards({ value: toWEI("200") });

    //pool should be 600
    expect(await ethPool.getBalance()).to.equal(toWEI("600"));

    expect(await ethPool.getUserReward(addr1.address)).to.equal(toWEI("50"));
    expect(await ethPool.getUserDeposit(addr1.address)).to.equal(toWEI("100"));

    expect(await ethPool.getUserReward(addr2.address)).to.equal(toWEI("150"));
    expect(await ethPool.getUserDeposit(addr2.address)).to.equal(toWEI("300"));

    // if addr1 withdraws, pool balance should be 450
    await ethPool.connect(addr1).withdrawRewards();
    expect(await ethPool.getBalance()).to.equal(toWEI("450"));

    // addr1 deposits and rewards should be 0
    expect(await ethPool.getUserDeposit(addr1.address)).to.equal(toWEI("0"));
    expect(await ethPool.getUserReward(addr1.address)).to.equal(toWEI("0"));

    // if addr2 withdraws pool balance should be 0
    await ethPool.connect(addr2).withdrawRewards();
    // expect(await ethPool.getBalance()).to.equal(toWEI('0'))

    // addr2 deposits and rewards should be 0
    expect(await ethPool.getUserDeposit(addr2.address)).to.equal(toWEI("0"));
    expect(await ethPool.getUserReward(addr2.address)).to.equal(toWEI("0"));
  });

  it("should give depositer A 100% of rewards if B depoisted after team deposited rewards. A,T,B", async () => {
    await ethPool.connect(addr1).depositEth({ value: toWEI("100") });
    await ethPool.addTeamMember(team.address);
    await ethPool.connect(team).depositRewards({ value: toWEI("200") });
    await ethPool.connect(addr2).depositEth({ value: toWEI("300") });

    //pool should be 600
    expect(await ethPool.getBalance()).to.equal(toWEI("600"));

    // addr1 should get 100% of rewards
    expect(await ethPool.getUserReward(addr1.address)).to.equal(toWEI("200"));
    expect(await ethPool.getUserDeposit(addr1.address)).to.equal(toWEI("100"));

    // addr2 should get 0% of rewards
    expect(await ethPool.getUserReward(addr2.address)).to.equal(toWEI("0"));
    expect(await ethPool.getUserDeposit(addr2.address)).to.equal(toWEI("300"));

    // if addr1 withdraws, pool balance should be 300
    await ethPool.connect(addr1).withdrawRewards();
    expect(await ethPool.getBalance()).to.equal(toWEI("300"));

    // addr1 deposits and rewards should be 0
    expect(await ethPool.getUserDeposit(addr1.address)).to.equal(toWEI("0"));
    expect(await ethPool.getUserReward(addr1.address)).to.equal(toWEI("0"));

    // if addr2 withdraws pool balance should be 0
    await ethPool.connect(addr2).withdrawRewards();
    expect(await ethPool.getBalance()).to.equal(toWEI("0"));

    // addr2 deposits and rewards should be 0
    expect(await ethPool.getUserDeposit(addr2.address)).to.equal(toWEI("0"));
    expect(await ethPool.getUserReward(addr2.address)).to.equal(toWEI("0"));
  });
});
