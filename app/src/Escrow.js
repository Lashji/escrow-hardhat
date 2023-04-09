import { ethers } from "ethers";
import { useEffect, useState } from "react";
import EscrowArtifact from "./artifacts/contracts/Escrow.sol/Escrow.json";

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  isApproved,
  isDeployer,
  isArbiter,
  provider,
  signer,
  contractAddr,
  handleApprove,
}) {
  console.log("isDeployer: ", isDeployer);
  console.log("isArbiter: ", isArbiter);
  const [depositVal, setDepositVal] = useState(0);

  const [contract, setContract] = useState();

  useEffect(() => {
    const escrowContract = new ethers.Contract(
      contractAddr,
      EscrowArtifact.abi,
      provider
    );
    setContract(escrowContract);
  }, []);

  const handleDeposit = async () => {
    const valueInEth = ethers.utils.parseEther(depositVal.toString());

    await contract.connect(signer).deposit({ value: valueInEth });
  };
  const handleRelease = async () => {
    await contract.connect(signer).release();
  };
  const handleRefund = async () => {
    await contract.connect(signer).refund();
  };

  return (
    <div className="flex">
      <ul className=" flex flex-col gap-4">
        <li className="flex justify-between gap-2">
          <div> Arbiter: </div>
          <div> {arbiter} </div>
        </li>
        <li className="flex justify-between gap-2">
          <div> Beneficiary: </div>
          <div> {beneficiary} </div>
        </li>
        <li className="flex justify-between gap-2">
          <div> Value: </div>
          <div> {value} </div>
        </li>
        {isDeployer && (
          <li className="flex flex-col w-full justify-between gap-4 items-center">
            <h3 className="text-3xl">Depositor options:</h3>
            <div className="flex w-full justify-between gap-2 items-center">
              <label> Deposit more: </label>
              <input
                className="text-slate-950"
                value={depositVal}
                onChange={(e) => setDepositVal(e.currentTarget.value)}
              />
              <button
                onClick={handleDeposit}
                className="bg-gray-800 py-1 px-2 shadow-2xl border-[1px] border-slate-900  rounded-2xl"
              >
                Deposit
              </button>
            </div>
            <div className="flex flex-col justify-between gap-4 w-full">
              <button
                onClick={handleRelease}
                className="bg-gray-800 py-1 flex-1 px-2 w-full shadow-2xl border-[1px] border-slate-900  rounded-2xl"
              >
                Release
              </button>
              <button
                onClick={handleRefund}
                className="bg-gray-800 py-1 flex-1 px-2 w-full shadow-2xl border-[1px] border-slate-900  rounded-2xl"
              >
                Refund
              </button>
            </div>
          </li>
        )}
        {isArbiter ? (
          !isApproved ? (
            <button
              className="bg-gray-800 py-1 px-2 shadow-2xl border-[1px] border-slate-900  rounded-2xl w-full"
              id={address}
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
            >
              Approve
            </button>
          ) : (
            <h3 className="flex justify-center text-green-500 items-center">
              ✓ Contract has been approved!
            </h3>
          )
        ) : null}
      </ul>
    </div>
  );
}
