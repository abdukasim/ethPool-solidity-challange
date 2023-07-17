// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EthPool
 * @dev A simple contract to pool ETH and distribute rewards to depositers.
 */
contract EthPool is AccessControl, Ownable{
    address[] public depositers;
    uint256 public totalDeposit = 0;
    uint256 public rewardsPool = 0;
    uint256 public lastDepositWeek = 0;

    struct DepositInfo {
        uint256 amount;
        uint256 rewardOwed;
    }

    mapping (address => DepositInfo) public deposits;

    bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");

    constructor() {
        _grantRole(TEAM_ROLE, msg.sender); 
    }

    /**
     * @dev Deposit ETH into the pool.
     */
    function depositEth() public payable {
        console.log("Depositing ETH...");
        require(msg.value > 0, "Must deposit more than 0 ETH.");
        depositers.push(msg.sender);
        deposits[msg.sender].amount= msg.value;
        console.log("Deposited ETH:", msg.value);
    }

    /**
     * @dev Deposit rewards into the pool by team members once per week.
     *
     */
    function depositRewards() public payable onlyRole(TEAM_ROLE) {
        // require(hasRole(TEAM_ROLE,msg.sender), "Only team members can deposit rewards");
        console.log("Depositing rewards...");
        // check if week has changed
        require(getCurrentWeek() > lastDepositWeek, "Rewards can only be deposited once per week.");    
        lastDepositWeek = getCurrentWeek();

        // check if there are rewards to deposit
        require(msg.value > 0, "Must deposit more than 0 ETH.");
        rewardsPool += msg.value;
        console.log("Deposited rewards:", msg.value);

        //determine amount of eth deposited by each depositer
        for (uint256 i = 0; i < depositers.length; i++) {
            totalDeposit += deposits[depositers[i]].amount;
        }

        // calculate the share of each depositer and add to their reward.
        for (uint256 i = 0; i < depositers.length; i++) {
            deposits[depositers[i]].rewardOwed += (deposits[depositers[i]].amount * rewardsPool) / totalDeposit;
        }
    }

    /**
     * @dev Withdraw rewards from the pool.
     */
    function withdrawRewards() public {
        console.log("Withdrawing rewards...");
        // check if there are rewards to in rewards pool
        require(rewardsPool > 0, "Rewards not available yet.");
        // check if depositer has rewards to withdraw
        require(deposits[msg.sender].amount > 0, "No rewards to withdraw.");

        // withdraw amount is reward + initial deposit
        uint256 reward = deposits[msg.sender].rewardOwed + deposits[msg.sender].amount;
        deposits[msg.sender] = DepositInfo(0, 0); 


        // transfer reward to depositer using call
        (bool success,) = msg.sender.call{value: reward}("");
        require(success, "Withdrawal failed.");
        console.log("Withdrew rewards:", reward);
    }

    /**
     * @dev get amount deposited by user.
     */
    function getUserDeposit(address depositer) public view returns (uint256) {
        return deposits[depositer].amount;
    }

    /**
     * @dev get rewards owed to user.
     */
    function getUserReward(address depositer) public view returns (uint256) {
        return deposits[depositer].rewardOwed;
    }

    /**
     * @dev helper function to view total deposits.
     */
    function getTotalDeposit() public view returns (uint256) {
        return totalDeposit;
    }

    /**
     * @dev helper function to view total rewards.
     */
    function getRewardsPool() public view returns (uint256) {
        return rewardsPool;
    }
    
    /**
     * @dev helper function to view balance of contract.
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev helper function to view current week.
     */
    function getCurrentWeek() public view returns (uint256) {
        return block.timestamp / 1 weeks; 
    }

    /**
     * @dev Add a team member to the contract.
     */
    function addTeamMember(address member) public onlyRole(TEAM_ROLE) {
        _grantRole(TEAM_ROLE, member);
    }
}