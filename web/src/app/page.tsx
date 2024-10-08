"use client";
import Head from "next/head";
import dynamic from "next/dynamic";
import {
    useBlockNumber,
    useAccount,
    useBalance,
    useContractRead,
    useContract,
    useContractWrite,
    useExplorer,
    useWaitForTransaction,
} from "@starknet-react/core";
import { BlockNumber } from "starknet";
import contractAbiETH from "../abis/abi_erc20.json";
import { useState, useMemo } from "react";

const WalletBar = dynamic(() => import("../components/WalletBar"), {
    ssr: false,
});
const Page: React.FC = () => {
    // Step 1 --> Read the latest block -- Start
    const {
        data: blockNumberData,
        isLoading: blockNumberIsLoading,
        isError: blockNumberIsError,
    } = useBlockNumber({
        blockIdentifier: "latest" as BlockNumber,
    });
    const workshopEnds = 170224;
    // Step 1 --> Read the latest block -- End

    // Step 2 --> Read your balance -- Start
    const { address: userAddress } = useAccount();
    const {
        isLoading: balanceIsLoading,
        isError: balanceIsError,
        error: balanceError,
        data: balanceData,
    } = useBalance({
        address: userAddress,
        watch: true,
    });
    // Step 2 --> Read your balance -- End

    // Step 3 --> Read from a contract -- Start
    // const contractAddress =
    //     "0x0232889b389b9495be13daf615861780c16194a47ceb592b71c62769452e505c"; // Sepolia
    const contractAddress =
        "0x01ffaf17ab9bf435c5973b892916465530c7deb98f7f335819fe9d0a083a9670"; // Mainnet

    const {
        data: readData,
        refetch: dataRefetch,
        isError: readIsError,
        isLoading: readIsLoading,
        error: readError,
    } = useContractRead({
        functionName: "balance_of",
        args: [userAddress ? userAddress : "0x0"],
        abi: contractAbiETH,
        address: contractAddress,
        watch: true,
    });
    // Step 3.1 --> Read from a contract Total supply -- End
    const {
        data: readData2,
        refetch: dataRefetch2,
        isError: readIsError2,
        isLoading: readIsLoading2,
        error: readError2,
    } = useContractRead({
        functionName: "total_supply",
        args: [],
        abi: contractAbiETH,
        address: contractAddress,
        watch: true,
    });
    // Step 3.1 --> Read from a contract  Total supply -- End

    // Step 4 --> Write to a contract -- Start
    const [amount, setAmount] = useState(0);
    const [amount2, setAmount2] = useState(0);
    const [addressTo, setAddressTo] = useState("0x00");
    const [actionType, setActionType] = useState("none");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // TO DO: Implement Starknet logic here
        if (actionType == "mint") {
            console.log("Form submitted with amount ", amount, actionType);
        } else if (actionType == "transfer") {
            console.log(
                "Form 2 submitted with amount ",
                amount2,
                addressTo,
                actionType
            );
        } else {
            console.log("Form submitted with no action defined");
        }
        writeAsync();
    };
    const { contract } = useContract({
        abi: contractAbiETH,
        address: contractAddress,
    });
    const calls = useMemo(() => {
        if (!userAddress || !contract) {
            return [];
        } else if (actionType == "mint") {
            return contract.populateTransaction["mint"]!(userAddress, {
                low: amount ? amount : 0,
                high: 0,
            });
        } else if (actionType == "transfer") {
            return contract.populateTransaction["transfer"]!(addressTo, {
                low: amount2 ? amount2 : 0,
                high: 0,
            });
        }
    }, [contract, userAddress, amount]);

    const {
        writeAsync,
        data: writeData,
        isPending: writeIsPending,
    } = useContractWrite({
        calls,
    });

    const explorer = useExplorer();
    const {
        isLoading: waitIsLoading,
        isError: waitIsError,
        error: waitError,
        data: waitData,
    } = useWaitForTransaction({
        hash: writeData?.transaction_hash,
        watch: true,
    });
    const LoadingState = ({ message }: { message: string }) => (
        <div className="flex items-center space-x-2">
            <div className="animate-spin">
                <svg
                    className="h-5 w-5 text-gray-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
            </div>
            <span>{message}</span>
        </div>
    );
    const buttonContent = () => {
        if (actionType != "mint") {
            return "Send";
        }
        if (writeIsPending) {
            return <LoadingState message="Send..." />;
        }

        if (waitIsLoading) {
            return <LoadingState message="Waiting for confirmation..." />;
        }

        if (waitData && waitData.status === "REJECTED") {
            return <LoadingState message="Transaction rejected..." />;
        }

        if (waitData) {
            return "Transaction confirmed";
        }

        return "Send";
    };

    const buttonContentTransf = () => {
        if (actionType != "transfer") {
            return "Transfer";
        }

        if (writeIsPending) {
            return <LoadingState message="Send..." />;
        }

        if (waitIsLoading) {
            return <LoadingState message="Waiting for confirmation..." />;
        }

        if (waitData && waitData.status === "REJECTED") {
            return <LoadingState message="Transaction rejected..." />;
        }

        if (waitData) {
            return "Transaction confirmed";
        }

        return "Transfer";
    };
    // Step 4 --> Write to a contract -- End

    return (
        <div className="h-screen flex flex-col justify-center items-center">
            <Head>
                <title>Frontend Workshop</title>
            </Head>
            <div className="flex flex-row mb-4">
                <WalletBar />
            </div>

            {/* Step 1 --> Read the latest block -- Start */}
            {!blockNumberIsLoading && !blockNumberIsError && (
                <div
                    className={`p-4 w-full max-w-md m-4 border-black border ${
                        blockNumberData! < workshopEnds
                            ? "bg-green-500"
                            : "bg-red-500"
                    }`}
                >
                    <h3 className="text-2xl font-bold mb-2">
                        Read the Blockchain
                    </h3>
                    <p>Current Block Number: {blockNumberData}</p>
                    {blockNumberData! < workshopEnds
                        ? "We're live on Workshop"
                        : "Workshop has ended"}
                </div>
            )}
            {/* <div
        className={`p-4 w-full max-w-md m-4 border-black border bg-white`}
      >
        <h3 className="text-2xl font-bold mb-2">Read the Blockchain</h3>
        <p>Current Block Number: xyz</p>
        Are we live?
      </div> */}
            {/* Step 1 --> Read the latest block -- End */}

            {/* Step 2 --> Read your balance -- Start */}
            {!balanceIsLoading && !balanceIsError && (
                <div
                    className={`p-4 w-full max-w-md m-4 bg-white border-red border`}
                >
                    <h3 className="text-2xl font-bold mb-2">
                        Read your Balance
                    </h3>
                    <p>Symbol: {balanceData?.symbol}</p>
                    <p>Balance: {Number(balanceData?.formatted).toFixed(4)}</p>
                </div>
            )}
            {/* <div
        className={`p-4 w-full max-w-md m-4 bg-white border-black border`}
      >
        <h3 className="text-2xl font-bold mb-2">Read your Balance</h3>
        <p>Symbol: Ticker</p>
        <p>Balance: xyz</p>
      </div> */}
            {/* Step 2 --> Read your balance -- End */}

            {/* Step 3 --> Read from a contract -- Start */}
            <div
                className={`p-4 w-full max-w-md m-4 bg-white border-black border`}
            >
                <h3 className="text-2xl font-bold mb-2">Read Total Supply</h3>
                <p>Total Supply: {readData2?.toString()}</p>
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => dataRefetch2()}
                        className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
                    >
                        Refresh
                    </button>
                </div>
            </div>
            {
                <div
                    className={`p-4 w-full max-w-md m-4 bg-white border-black border`}
                >
                    <h3 className="text-2xl font-bold mb-2">
                        Read your Contract
                    </h3>
                    <p>Balance: {readData?.toString()}</p>
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => dataRefetch()}
                            className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            }
            {/* Step 3 --> Read from a contract -- End */}

            {/* Step 4 --> Write to a contract -- Start */}
            <form
                onSubmit={handleSubmit}
                className="bg-white p-4 w-full max-w-md m-4 border-black border"
            >
                <h3 className="text-2xl font-bold mb-2">Mint to your wallet</h3>
                <label
                    htmlFor="amount"
                    className="block text-sm font-medium leading-6 text-gray-900"
                >
                    Amount:
                </label>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.valueAsNumber)}
                    className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
                />
                {writeData?.transaction_hash && (
                    <a
                        href={explorer.transaction(writeData?.transaction_hash)}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-700 underline"
                        rel="noreferrer"
                    >
                        Check TX on {explorer.name}
                    </a>
                )}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setActionType("mint")}
                        type="submit"
                        className={`border border-black text-black font-regular py-2 px-4 ${
                            userAddress
                                ? "bg-yellow-300 hover:bg-yellow-500"
                                : "bg-white"
                        } `}
                        disabled={!userAddress}
                    >
                        {buttonContent()}
                    </button>
                </div>
            </form>
            {
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-4 w-full max-w-md m-4 border-black border"
                >
                    <h3 className="text-2xl font-bold mb-2">
                        Transfer token to another account
                    </h3>
                    <label
                        htmlFor="amount2"
                        className="block text-sm font-medium leading-6 text-gray-900"
                    >
                        Amount:
                    </label>
                    <input
                        type="number"
                        id="amount2"
                        value={amount2}
                        onChange={(event) =>
                            setAmount2(event.target.valueAsNumber)
                        }
                        className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
                    />
                    <label
                        htmlFor="addressTo"
                        className="block text-sm font-medium leading-6 text-gray-900"
                    >
                        Address to:
                    </label>
                    <input
                        type="text"
                        id="addressTo"
                        value={addressTo}
                        onChange={(event) => setAddressTo(event.target.value)}
                        className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
                    />

                    {writeData?.transaction_hash && (
                        <a
                            href={explorer.transaction(
                                writeData?.transaction_hash
                            )}
                            target="_blank"
                            className="text-blue-500 hover:text-blue-700 underline"
                            rel="noreferrer"
                        >
                            Check TX on {explorer.name}
                        </a>
                    )}

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => setActionType("transfer")}
                            type="submit"
                            //className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
                            className={`border border-black text-black font-regular py-2 px-4 ${
                                userAddress
                                    ? "bg-yellow-300 hover:bg-yellow-500"
                                    : "bg-white"
                            } `}
                            disabled={!userAddress}
                        >
                            {buttonContentTransf()}
                        </button>
                    </div>
                </form>
            }
            {/* Step 4 --> Write to a contract -- End */}
        </div>
    );
};

export default Page;
