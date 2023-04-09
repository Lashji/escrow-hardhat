const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Escrow", function () {
  let contract;
  let depositor;
  let beneficiary;
  let arbiter;
  const deposit = ethers.utils.parseEther("1");
  beforeEach(async () => {
    depositor = ethers.provider.getSigner(0);
    beneficiary = ethers.provider.getSigner(1);
    arbiter = ethers.provider.getSigner(2);
    const Escrow = await ethers.getContractFactory("Escrow");
    contract = await Escrow.deploy(
      arbiter.getAddress(),
      beneficiary.getAddress(),
      {
        value: deposit,
      }
    );
    await contract.deployed();
  });

  it("should be funded initially", async function () {
    let balance = await ethers.provider.getBalance(contract.address);
    expect(balance).to.eq(deposit);
  });

  describe("after approval from address other than the arbiter", () => {
    it("should revert", async () => {
      await expect(contract.connect(beneficiary).approve()).to.be.reverted;
    });
  });

  describe("after approval from the arbiter", () => {
    it("should transfer balance to beneficiary", async () => {
      const before = await ethers.provider.getBalance(beneficiary.getAddress());
      const approveTxn = await contract.connect(arbiter).approve();
      await approveTxn.wait();
      const after = await ethers.provider.getBalance(beneficiary.getAddress());
      expect(after.sub(before)).to.eq(deposit);
    });
  });

  describe("Deposit should increase balance", () => {
    it("should increase balance", async () => {
      const before = await ethers.provider.getBalance(contract.address);
      const depositTxn = await contract.connect(depositor).deposit({
        value: deposit,
      });
      await depositTxn.wait();
      const after = await ethers.provider.getBalance(contract.address);
      expect(after.sub(before)).to.eq(deposit);
    });
  });

  describe("Refund", () => {
    it("should decrease balance to zero", async () => {
      const before = await ethers.provider.getBalance(contract.address);
      const withdrawTxn = await contract.connect(depositor).refund();
      await withdrawTxn.wait();
      const after = await ethers.provider.getBalance(contract.address);
      expect(after).to.eq(0);
    });

    it("should revert if not depositor", async () => {
      await expect(contract.connect(beneficiary).refund()).to.be.reverted;
    });
  });

  describe("Release", () => {
    it("should revert if not deployer", async () => {
      await expect(contract.connect(arbiter).release()).to.be.reverted;
    });

    it("should destroy the contract", async () => {
      const releaseTxn = await contract.connect(depositor).release();
      await releaseTxn.wait();
      const code = await ethers.provider.getCode(contract.address);
      expect(code).to.eq("0x");
    });
  });
});
