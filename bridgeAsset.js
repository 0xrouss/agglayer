import { isPropertyAccessChain } from "typescript";
import {
    createClient,
    createPublicClient,
    http,
    formatEther,
    createWalletClient,
    decodeAbiParameters,
} from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { sepolia, polygonZkEvmCardona, astarZkyoto } from "viem/chains";
import PolygonZkEVMBridge from "./ABIs/PolygonZkEVMBridge";

const AMOUNT = 100000000000000n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DESTINATION_ADDRESS = "";
const TESTNET_BRIDGE_ADDRESS = "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582";

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

console.log(address);

console.log(
    "Sepolia balance: ",
    formatEther(
        await publicClients[0].getBalance({
            address: address,
        })
    )
);

console.log(
    "ZkEvm Cardona balance: ",
    formatEther(
        await publicClients[1].getBalance({
            address: address,
        })
    )
);

console.log(
    "Astar zKyoto balance: ",
    formatEther(
        await publicClients[2].getBalance({
            address: address,
        })
    )
);

console.log("Amount to transfer: ", formatEther(AMOUNT));

console.log(publicClients.map((c) => c.chain.name));

async function bridgeAsset(
    originNetwork,
    destinationNetwork,
    destinationAddress,
    amount,
    token,
    forceUpdateGlobalExitRoot,
    permitData
) {
    console.log("Destination network: ", destinationNetwork);
    console.log("Destination address: ", destinationAddress);
    console.log("Amount: ", amount);
    console.log("Token: ", token);
    console.log("Force update global exit root: ", forceUpdateGlobalExitRoot);
    console.log("Permit data: ", permitData);

    console.log("--------- Starting bridge transaction ---------");

    const { request } = await publicClients[originNetwork].simulateContract({
        address: TESTNET_BRIDGE_ADDRESS,
        abi: PolygonZkEVMBridge,
        functionName: "bridgeAsset",
        args: [
            destinationNetwork,
            destinationAddress,
            amount,
            token,
            forceUpdateGlobalExitRoot,
            permitData,
        ],
        account,
        value: amount,
    });

    //console.log(request);

    const client = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(),
    });

    const tx = await client.writeContract(request);

    console.log(tx);
}

bridgeAsset(0, 1, address, AMOUNT, ZERO_ADDRESS, true, "");
