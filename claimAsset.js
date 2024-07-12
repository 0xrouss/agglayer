import { createPublicClient, createWalletClient, http } from "viem";
import { buildPayloadForClaim } from ".";
import { privateKeyToAccount } from "viem/accounts";
import { astarZkyoto, polygonZkEvmCardona, sepolia } from "viem/chains";
import PolygonZkEVMBridge from "./ABIs/PolygonZkEVMBridge";

const data = await buildPayloadForClaim(
    "0xf95a82d1de2e647f0c01f5042ba080d60c9544bac2556654fd53e5c373c0d954",
    0,
    false
);

const TESTNET_BRIDGE_ADDRESS = "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582";

const smtProofLocalExitRoot = data.smtProof;
const smtProofRollupExitRoot = data.smtProofRollup;
const globalIndex = data.globalIndex;
const mainnetExitRoot = data.mainnetExitRoot;
const rollupExitRoot = data.rollupExitRoot;
const originNetwork = data.originNetwork;
const originTokenAddress = data.originTokenAddress;
const destinationNetwork = data.destinationNetwork;
const destinationAddress = data.destinationAddress;
const amount = data.amount;
const metadata = data.metadata;

/*
console.log(smtProofLocalExitRoot);
console.log(smtProofRollupExitRoot);
console.log(mainnetExitRoot);
console.log(rollupExitRoot); */

const publicClients = [
    createPublicClient({
        chain: sepolia,
        transport: http(),
    }),
    createPublicClient({
        chain: polygonZkEvmCardona,
        transport: http(),
    }),
    createPublicClient({
        chain: astarZkyoto,
        transport: http(),
    }),
];

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

const address = account.address;

const { request } = await publicClients[1].simulateContract({
    address: TESTNET_BRIDGE_ADDRESS,
    abi: PolygonZkEVMBridge,
    functionName: "claimAsset",
    args: [
        smtProofLocalExitRoot,
        smtProofRollupExitRoot,
        globalIndex,
        mainnetExitRoot,
        rollupExitRoot,
        originNetwork,
        originTokenAddress,
        destinationNetwork,
        destinationAddress,
        amount,
        metadata,
    ],
    account,
});

console.log(request);

const client = createWalletClient({
    account: account,
    chain: polygonZkEvmCardona,
    transport: http(),
});

const tx = await client.writeContract({
    address: TESTNET_BRIDGE_ADDRESS,
    abi: PolygonZkEVMBridge,
    functionName: "claimAsset",
    args: [
        smtProofLocalExitRoot,
        smtProofRollupExitRoot,
        globalIndex,
        mainnetExitRoot,
        rollupExitRoot,
        originNetwork,
        originTokenAddress,
        destinationNetwork,
        destinationAddress,
        amount,
        metadata,
    ],
    account,
});
