// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract JobBoardEscrow {
    enum Status { Open, InProgress, Completed, Paid }

    struct Job {
        address requester;
        address agent;
        uint256 reward;
        Status status;
        bytes32 detailsHash;
        bytes32 resultHash;
    }

    mapping(uint256 => Job) public jobs;
    uint256 public nextJobId;

    event JobPosted(uint256 indexed jobId, address indexed requester, uint256 reward, bytes32 detailsHash);
    event JobAccepted(uint256 indexed jobId, address indexed agent);
    event JobCompleted(uint256 indexed jobId, bytes32 resultHash);
    event JobPaid(uint256 indexed jobId, address indexed agent, uint256 reward);

    function postJob(bytes32 detailsHash) external payable returns (uint256 jobId) {
        require(msg.value > 0, "Must deposit reward");
        jobId = nextJobId++;
        jobs[jobId] = Job({
            requester: msg.sender,
            agent: address(0),
            reward: msg.value,
            status: Status.Open,
            detailsHash: detailsHash,
            resultHash: bytes32(0)
        });
        emit JobPosted(jobId, msg.sender, msg.value, detailsHash);
    }

    function acceptJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.status == Status.Open, "Job not open");
        require(job.requester != msg.sender, "Requester cannot accept own job");
        job.agent = msg.sender;
        job.status = Status.InProgress;
        emit JobAccepted(jobId, msg.sender);
    }

    function completeJob(uint256 jobId, bytes32 resultHash) external {
        Job storage job = jobs[jobId];
        require(job.status == Status.InProgress, "Job not in progress");
        require(job.agent == msg.sender, "Only assigned agent");
        job.resultHash = resultHash;
        job.status = Status.Completed;
        emit JobCompleted(jobId, resultHash);
    }

    function approveAndPay(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.status == Status.Completed, "Job not completed");
        require(job.requester == msg.sender, "Only requester");
        job.status = Status.Paid;
        (bool sent, ) = payable(job.agent).call{value: job.reward}("");
        require(sent, "Payment failed");
        emit JobPaid(jobId, job.agent, job.reward);
    }
}
