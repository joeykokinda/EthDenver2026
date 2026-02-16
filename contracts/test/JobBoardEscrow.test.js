const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobBoardEscrow", function () {
  let escrow, requester, workerA, workerB;
  const detailsHash = ethers.id("test job details");
  const resultHash = ethers.id("test result");

  beforeEach(async function () {
    [requester, workerA, workerB] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("JobBoardEscrow");
    escrow = await Escrow.deploy();
  });

  describe("postJob", function () {
    it("creates a job with correct state", async function () {
      const reward = ethers.parseEther("1.0");
      await escrow.postJob(detailsHash, { value: reward });

      const job = await escrow.jobs(0);
      expect(job.requester).to.equal(requester.address);
      expect(job.reward).to.equal(reward);
      expect(job.status).to.equal(0); // Open
      expect(job.detailsHash).to.equal(detailsHash);
    });

    it("emits JobPosted event", async function () {
      const reward = ethers.parseEther("1.0");
      await expect(escrow.postJob(detailsHash, { value: reward }))
        .to.emit(escrow, "JobPosted")
        .withArgs(0, requester.address, reward, detailsHash);
    });

    it("reverts with zero value", async function () {
      await expect(escrow.postJob(detailsHash, { value: 0 }))
        .to.be.revertedWith("Must deposit reward");
    });

    it("increments jobId", async function () {
      const reward = ethers.parseEther("0.5");
      await escrow.postJob(detailsHash, { value: reward });
      await escrow.postJob(detailsHash, { value: reward });
      expect(await escrow.nextJobId()).to.equal(2);
    });
  });

  describe("acceptJob", function () {
    beforeEach(async function () {
      await escrow.postJob(detailsHash, { value: ethers.parseEther("1.0") });
    });

    it("assigns agent and sets InProgress", async function () {
      await escrow.connect(workerA).acceptJob(0);
      const job = await escrow.jobs(0);
      expect(job.agent).to.equal(workerA.address);
      expect(job.status).to.equal(1); // InProgress
    });

    it("emits JobAccepted event", async function () {
      await expect(escrow.connect(workerA).acceptJob(0))
        .to.emit(escrow, "JobAccepted")
        .withArgs(0, workerA.address);
    });

    it("reverts if not open", async function () {
      await escrow.connect(workerA).acceptJob(0);
      await expect(escrow.connect(workerB).acceptJob(0))
        .to.be.revertedWith("Job not open");
    });

    it("reverts if requester tries to accept own job", async function () {
      await expect(escrow.acceptJob(0))
        .to.be.revertedWith("Requester cannot accept own job");
    });
  });

  describe("completeJob", function () {
    beforeEach(async function () {
      await escrow.postJob(detailsHash, { value: ethers.parseEther("1.0") });
      await escrow.connect(workerA).acceptJob(0);
    });

    it("sets result and status to Completed", async function () {
      await escrow.connect(workerA).completeJob(0, resultHash);
      const job = await escrow.jobs(0);
      expect(job.resultHash).to.equal(resultHash);
      expect(job.status).to.equal(2); // Completed
    });

    it("emits JobCompleted event", async function () {
      await expect(escrow.connect(workerA).completeJob(0, resultHash))
        .to.emit(escrow, "JobCompleted")
        .withArgs(0, resultHash);
    });

    it("reverts if wrong agent", async function () {
      await expect(escrow.connect(workerB).completeJob(0, resultHash))
        .to.be.revertedWith("Only assigned agent");
    });

    it("reverts if not in progress", async function () {
      await escrow.connect(workerA).completeJob(0, resultHash);
      await expect(escrow.connect(workerA).completeJob(0, resultHash))
        .to.be.revertedWith("Job not in progress");
    });
  });

  describe("approveAndPay", function () {
    const reward = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.postJob(detailsHash, { value: reward });
      await escrow.connect(workerA).acceptJob(0);
      await escrow.connect(workerA).completeJob(0, resultHash);
    });

    it("pays agent and sets Paid status", async function () {
      const balBefore = await ethers.provider.getBalance(workerA.address);
      await escrow.approveAndPay(0);
      const balAfter = await ethers.provider.getBalance(workerA.address);
      expect(balAfter - balBefore).to.equal(reward);

      const job = await escrow.jobs(0);
      expect(job.status).to.equal(3); // Paid
    });

    it("emits JobPaid event", async function () {
      await expect(escrow.approveAndPay(0))
        .to.emit(escrow, "JobPaid")
        .withArgs(0, workerA.address, reward);
    });

    it("reverts if not requester", async function () {
      await expect(escrow.connect(workerA).approveAndPay(0))
        .to.be.revertedWith("Only requester");
    });

    it("reverts if not completed", async function () {
      await escrow.approveAndPay(0); // pays once
      await expect(escrow.approveAndPay(0))
        .to.be.revertedWith("Job not completed");
    });
  });
});
