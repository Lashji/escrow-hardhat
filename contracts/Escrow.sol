// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
    address public arbiter;
    address public beneficiary;
    address public depositor;

    bool public isApproved;

    constructor(address _arbiter, address _beneficiary) payable {
        arbiter = _arbiter;
        beneficiary = _beneficiary;
        depositor = msg.sender;
    }

    event Approved(uint);

    function approve() external {
        require(msg.sender == arbiter);
        uint balance = address(this).balance;
        (bool sent, ) = payable(beneficiary).call{value: balance}("");
        require(sent, "Failed to send Ether");
        emit Approved(balance);
        isApproved = true;
    }

    function deposit() external payable {
        require(msg.sender == depositor);
    }

    function refund() external {
        require(msg.sender == depositor);
        require(!isApproved);
        uint balance = address(this).balance;
        (bool sent, ) = payable(depositor).call{value: balance}("");
        require(sent, "Failed to send Ether");
    }

    function release() external {
        require(msg.sender == depositor);
        require(!isApproved);
        selfdestruct(payable(depositor));
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
