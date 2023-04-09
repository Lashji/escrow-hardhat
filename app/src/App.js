import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";
import EscrowArtifact from "./artifacts/contracts/Escrow.sol/Escrow.json";

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [searchVal, setSearchVal] = useState("");
  const [isDeployer, setIsDeployer] = useState(false);
  const [isArbiter, setIsArbiter] = useState(false);

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send("eth_requestAccounts", []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  useEffect(() => {
    setIsArbiter(false);
    setIsDeployer(false);
    setEscrows([]);
  }, [account]);

  async function handleEscrowSearch() {
    const escrowContract = new ethers.Contract(
      searchVal,
      EscrowArtifact.abi,
      provider
    );

    if ((await provider.getCode(searchVal)) === "0x") {
      alert("Contract not deployed");
      return;
    }

    const arbiter = await escrowContract.arbiter();
    const deployer = await escrowContract.depositor();
    const beneficiary = await escrowContract.beneficiary();
    const isApproved = await escrowContract.isApproved();
    const value = await provider.getBalance(escrowContract.address);

    if (account.toLowerCase() === arbiter.toLowerCase()) {
      setIsArbiter(true);
    } else {
      setIsArbiter(false);
    }

    if (account.toLowerCase() === deployer.toLowerCase()) {
      setIsDeployer(true);
    } else {
      setIsDeployer(false);
    }

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      isApproved,
      value: ethers.utils.formatEther(value),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([escrow]);
  }

  async function newContract() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.BigNumber.from(document.getElementById("wei").value);
    const valueInEth = ethers.utils.parseEther(value.toString());
    const escrowContract = await deploy(
      signer,
      arbiter,
      beneficiary,
      valueInEth
    );
    console.log(value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      isApproved: false,
      value: ethers.utils.formatEther(valueInEth),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setIsDeployer(true);

    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <div className=" flex flex-col h-screen gap-8 text-white justify-center items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="w-1/3 gap-4 flex justify-center items-center flex-col">
          <h1 className="text-7xl mb-12">New Contract</h1>
          <div className="flex w-96 justify-between gap-4">
            <label>Arbiter Address:</label>
            <input className="text-slate-900" type="text" id="arbiter" />
          </div>
          <div className="flex w-96 justify-between gap-4">
            <label>Beneficiary Address:</label>
            <input className="text-slate-900" type="text" id="beneficiary" />
          </div>
          <div className="flex w-96 justify-between gap-4">
            <label>Deposit Amount (ETH)</label>
            <input className="text-slate-900" type="text" id="wei" />
          </div>
          <div className="flex w-96 justify-between gap-4 ">
            <button
              className="flex w-full justify-center bg-gray-700 text-white p-1 shadow-2xl border-[1px] border-slate-900 rounded-2xl items-center"
              id="deploy"
              onClick={(e) => {
                e.preventDefault();

                newContract();
              }}
            >
              Deploy
            </button>
          </div>
        </div>
        <div className="existing-contracts gap-4 flex flex-col bg-gray-700 rounded-2xl p-4">
          <h1 className="text-5xl mb-4"> Existing Contracts </h1>
          <div className="flex gap-4 w-full items-center ">
            <label>Address: </label>
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.currentTarget.value)}
              className="w-full text-slate-900"
            />
            <button
              onClick={handleEscrowSearch}
              className="bg-gray-800 py-1 px-2 shadow-2xl border-[1px] border-slate-900  rounded-2xl"
            >
              Search
            </button>
          </div>
          <div id="">
            {escrows.length > 0 ? (
              escrows.map((escrow) => {
                return (
                  <Escrow
                    provider={provider}
                    key={escrow.address}
                    isDeployer={isDeployer}
                    isArbiter={isArbiter}
                    contractAddr={escrow.address}
                    signer={signer}
                    {...escrow}
                  />
                );
              })
            ) : (
              <h1 className="text-2xl flex justify-center items-center">
                No Escrows found
              </h1>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
