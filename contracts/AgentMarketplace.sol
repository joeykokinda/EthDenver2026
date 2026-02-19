// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./AgentIdentity.sol";

/**
 * @title AgentMarketplace
 * @dev Autonomous agent-to-agent job marketplace with HBAR escrow and reputation updates
 * Built for AgentTrust at ETHDenver 2026
 */
contract AgentMarketplace {
    AgentIdentity public identityContract;

    enum JobState { Open, Assigned, Delivered, Completed, Failed, Cancelled }
    enum BidState { Pending, Accepted, Rejected }

    struct Job {
        uint256 id;
        address poster;
        bytes32 descriptionHash;  // Hash of job description (off-chain storage)
        uint256 escrowAmount;
        uint256 deadline;
        uint256 createdAt;
        JobState state;
        uint256 acceptedBidId;
        address assignedWorker;
        bytes32 deliverableHash;
        uint8 rating;  // 0-100
        bytes32 evidenceHash;
    }

    struct Bid {
        uint256 id;
        uint256 jobId;
        address bidder;
        uint256 price;
        bytes32 bidHash;  // Hash of bid details
        uint256 createdAt;
        BidState state;
    }

    // State
    uint256 public jobCounter;
    uint256 public bidCounter;
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Bid) public bids;
    mapping(uint256 => uint256[]) public jobBids;  // jobId => bidIds
    
    // Constants
    uint256 public constant MIN_DEADLINE = 300;  // 5 minutes minimum
    uint256 public constant MAX_DEADLINE = 86400;  // 24 hours maximum
    uint256 public constant DISPUTE_WINDOW = 60;  // 60 seconds dispute window

    // Events
    event JobPosted(
        uint256 indexed jobId,
        address indexed poster,
        bytes32 descriptionHash,
        uint256 escrowAmount,
        uint256 deadline,
        uint256 timestamp
    );

    event BidSubmitted(
        uint256 indexed bidId,
        uint256 indexed jobId,
        address indexed bidder,
        uint256 price,
        bytes32 bidHash,
        uint256 timestamp
    );

    event BidAccepted(
        uint256 indexed jobId,
        uint256 indexed bidId,
        address indexed worker,
        uint256 timestamp
    );

    event DeliverySubmitted(
        uint256 indexed jobId,
        address indexed worker,
        bytes32 deliverableHash,
        uint256 timestamp
    );

    event JobFinalized(
        uint256 indexed jobId,
        address indexed worker,
        bool success,
        uint8 rating,
        uint256 payment,
        bytes32 evidenceHash,
        uint256 timestamp
    );

    event JobFailedTimeout(
        uint256 indexed jobId,
        address indexed worker,
        uint256 timestamp
    );

    event JobCancelled(
        uint256 indexed jobId,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyRegistered() {
        require(identityContract.isRegistered(msg.sender), "Agent not registered");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobId > 0 && jobId <= jobCounter, "Job does not exist");
        _;
    }

    modifier bidExists(uint256 bidId) {
        require(bidId > 0 && bidId <= bidCounter, "Bid does not exist");
        _;
    }

    constructor(address _identityContract) {
        identityContract = AgentIdentity(_identityContract);
    }

    /**
     * @dev Post a new job with HBAR escrow
     * @param descriptionHash Hash of job description (stored off-chain)
     * @param deadline Seconds from now until job must be completed
     */
    function postJob(
        bytes32 descriptionHash,
        uint256 deadline
    ) external payable onlyRegistered {
        require(msg.value > 0, "Escrow amount must be > 0");
        require(deadline >= MIN_DEADLINE && deadline <= MAX_DEADLINE, "Invalid deadline");
        require(descriptionHash != bytes32(0), "Description hash required");

        jobCounter++;
        
        jobs[jobCounter] = Job({
            id: jobCounter,
            poster: msg.sender,
            descriptionHash: descriptionHash,
            escrowAmount: msg.value,
            deadline: block.timestamp + deadline,
            createdAt: block.timestamp,
            state: JobState.Open,
            acceptedBidId: 0,
            assignedWorker: address(0),
            deliverableHash: bytes32(0),
            rating: 0,
            evidenceHash: bytes32(0)
        });

        emit JobPosted(
            jobCounter,
            msg.sender,
            descriptionHash,
            msg.value,
            block.timestamp + deadline,
            block.timestamp
        );
    }

    /**
     * @dev Submit a bid on an open job
     * @param jobId The job to bid on
     * @param price Proposed price in wei
     * @param bidHash Hash of bid details
     */
    function bidOnJob(
        uint256 jobId,
        uint256 price,
        bytes32 bidHash
    ) external onlyRegistered jobExists(jobId) {
        Job storage job = jobs[jobId];
        
        require(job.state == JobState.Open, "Job not open for bids");
        require(msg.sender != job.poster, "Cannot bid on own job");
        require(price > 0 && price <= job.escrowAmount, "Invalid bid price");
        require(block.timestamp < job.deadline, "Job deadline passed");

        bidCounter++;
        
        bids[bidCounter] = Bid({
            id: bidCounter,
            jobId: jobId,
            bidder: msg.sender,
            price: price,
            bidHash: bidHash,
            createdAt: block.timestamp,
            state: BidState.Pending
        });

        jobBids[jobId].push(bidCounter);

        emit BidSubmitted(
            bidCounter,
            jobId,
            msg.sender,
            price,
            bidHash,
            block.timestamp
        );
    }

    /**
     * @dev Accept a bid and assign the job
     * @param jobId The job
     * @param bidId The bid to accept
     */
    function acceptBid(
        uint256 jobId,
        uint256 bidId
    ) external jobExists(jobId) bidExists(bidId) {
        Job storage job = jobs[jobId];
        Bid storage bid = bids[bidId];

        require(msg.sender == job.poster, "Only poster can accept bids");
        require(job.state == JobState.Open, "Job not open");
        require(bid.jobId == jobId, "Bid not for this job");
        require(bid.state == BidState.Pending, "Bid not pending");
        require(block.timestamp < job.deadline, "Job deadline passed");

        // Update job
        job.state = JobState.Assigned;
        job.acceptedBidId = bidId;
        job.assignedWorker = bid.bidder;

        // Update bid
        bid.state = BidState.Accepted;

        // Reject other bids
        uint256[] memory jobBidIds = jobBids[jobId];
        for (uint256 i = 0; i < jobBidIds.length; i++) {
            if (jobBidIds[i] != bidId && bids[jobBidIds[i]].state == BidState.Pending) {
                bids[jobBidIds[i]].state = BidState.Rejected;
            }
        }

        emit BidAccepted(jobId, bidId, bid.bidder, block.timestamp);
    }

    /**
     * @dev Submit work delivery
     * @param jobId The job
     * @param deliverableHash Hash of the deliverable
     */
    function submitDelivery(
        uint256 jobId,
        bytes32 deliverableHash
    ) external jobExists(jobId) {
        Job storage job = jobs[jobId];

        require(msg.sender == job.assignedWorker, "Not assigned worker");
        require(job.state == JobState.Assigned, "Job not in assigned state");
        require(block.timestamp < job.deadline, "Deadline passed");
        require(deliverableHash != bytes32(0), "Deliverable hash required");

        job.state = JobState.Delivered;
        job.deliverableHash = deliverableHash;

        emit DeliverySubmitted(jobId, msg.sender, deliverableHash, block.timestamp);
    }

    /**
     * @dev Finalize a job and release payment
     * @param jobId The job
     * @param success Whether the delivery was acceptable
     * @param rating Rating 0-100
     * @param evidenceHash Hash of evidence/review
     */
    function finalizeJob(
        uint256 jobId,
        bool success,
        uint8 rating,
        bytes32 evidenceHash
    ) external jobExists(jobId) {
        Job storage job = jobs[jobId];

        require(msg.sender == job.poster, "Only poster can finalize");
        require(job.state == JobState.Delivered, "Job not delivered");
        require(rating <= 100, "Rating must be 0-100");

        job.rating = rating;
        job.evidenceHash = evidenceHash;

        if (success) {
            job.state = JobState.Completed;
            
            // Pay worker
            Bid memory acceptedBid = bids[job.acceptedBidId];
            uint256 payment = acceptedBid.price;
            
            // Refund excess escrow to poster
            uint256 refund = job.escrowAmount - payment;
            if (refund > 0) {
                payable(job.poster).transfer(refund);
            }
            
            // Pay worker
            payable(job.assignedWorker).transfer(payment);

            // Update reputation in identity contract
            identityContract.updateAgentStats(
                job.assignedWorker,
                payment,
                rating,
                true
            );

            emit JobFinalized(jobId, job.assignedWorker, true, rating, payment, evidenceHash, block.timestamp);
        } else {
            job.state = JobState.Failed;
            
            // Refund poster
            payable(job.poster).transfer(job.escrowAmount);

            // Penalize worker reputation
            identityContract.updateAgentStats(
                job.assignedWorker,
                0,
                0,
                false
            );

            emit JobFinalized(jobId, job.assignedWorker, false, rating, 0, evidenceHash, block.timestamp);
        }
    }

    /**
     * @dev Finalize a job that passed deadline without delivery
     * @param jobId The job
     */
    function finalizeAfterDeadline(uint256 jobId) external jobExists(jobId) {
        Job storage job = jobs[jobId];

        require(block.timestamp >= job.deadline, "Deadline not passed");
        require(job.state == JobState.Assigned || job.state == JobState.Delivered, "Invalid state for timeout");

        job.state = JobState.Failed;

        // Refund poster
        payable(job.poster).transfer(job.escrowAmount);

        // Penalize worker if assigned
        if (job.assignedWorker != address(0)) {
            identityContract.updateAgentStats(
                job.assignedWorker,
                0,
                0,
                false
            );

            emit JobFailedTimeout(jobId, job.assignedWorker, block.timestamp);
        } else {
            emit JobCancelled(jobId, block.timestamp);
        }
    }

    /**
     * @dev Cancel an open job with no bids
     * @param jobId The job
     */
    function cancelJob(uint256 jobId) external jobExists(jobId) {
        Job storage job = jobs[jobId];

        require(msg.sender == job.poster, "Only poster can cancel");
        require(job.state == JobState.Open, "Can only cancel open jobs");
        require(jobBids[jobId].length == 0, "Cannot cancel job with bids");

        job.state = JobState.Cancelled;

        // Refund poster
        payable(job.poster).transfer(job.escrowAmount);

        emit JobCancelled(jobId, block.timestamp);
    }

    // View functions

    function getJob(uint256 jobId) external view jobExists(jobId) returns (Job memory) {
        return jobs[jobId];
    }

    function getBid(uint256 bidId) external view bidExists(bidId) returns (Bid memory) {
        return bids[bidId];
    }

    function getJobBids(uint256 jobId) external view jobExists(jobId) returns (uint256[] memory) {
        return jobBids[jobId];
    }

    function getOpenJobs() external view returns (uint256[] memory) {
        uint256 openCount = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].state == JobState.Open) {
                openCount++;
            }
        }

        uint256[] memory openJobIds = new uint256[](openCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].state == JobState.Open) {
                openJobIds[index] = i;
                index++;
            }
        }

        return openJobIds;
    }
}
