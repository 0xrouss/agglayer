import {
    createClient,
    createPublicClient,
    http,
    formatEther,
    createWalletClient,
    decodeAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { astarZkyoto, polygonZkEvmCardona, sepolia } from "viem/chains";

import PolygonZkEVMBridgeABI from "./ABIs/PolygonZkEVMBridge";

const PROOF_API = "https://bridge-api-testnet-dev.polygon.technology/";

const _GLOBAL_INDEX_MAINNET_FLAG = BigInt(2 ** 64);

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

function getBridgeLogData(transactionHash, networkId, isRefuel) {
    return publicClients[networkId]
        .getTransactionReceipt({ hash: transactionHash })
        .then((receipt) => {
            const logs = receipt.logs.filter(
                (log) =>
                    log.topics[0].toLowerCase() ===
                    "0x501781209a1f8899323b96b4ef08b168df93e0a90c673d1e4cce39366cb62f9b"
            );
            if (!logs.length) {
                throw new Error("Log not found in receipt");
            }

            const data = logs[isRefuel ? 1 : 0].data;
            return decodedBridgeData(data, networkId);
        });
}

function decodedBridgeData(data, networkId) {
    const abi = PolygonZkEVMBridgeABI;
    const types = abi.filter((event) => event.name === "BridgeEvent");

    if (!types.length) {
        throw new Error("Data not decoded");
    }

    const decodedData = decodeAbiParameters(types[0].inputs, data);
    const [
        leafType,
        originNetwork,
        originTokenAddress,
        destinationNetwork,
        destinationAddress,
        amount,
        metadata,
        depositCount,
    ] = decodedData;

    const result = {
        leafType,
        originNetwork,
        originTokenAddress,
        destinationNetwork,
        destinationAddress,
        amount,
        metadata: metadata || "0x",
        depositCount,
    };

    return Promise.resolve(result);
}

function getProof(networkId, depositCount) {
    return getMerkleProof(networkId, depositCount)
        .then((proof) => {
            return proof;
        })
        .catch((_) => {
            throw new Error("Error in creating proof");
        });
}

async function getMerkleProof(networkId, depositCount) {
    const url =
        PROOF_API +
        `merkle-proof?networkId=${networkId}&depositCount=${depositCount}`;

    //console.log(url);

    try {
        const response = await fetch(url);

        if (response.ok) {
            const blob = await response.blob();
            const text = await blob.text();
            const json = JSON.parse(text);

            return json.proof;
        } else {
            console.error("HTTP error", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Fetch error", error);
    }
}

function computeGlobalIndex(indexLocal, sourceNetworkId) {
    if (BigInt(sourceNetworkId) === BigInt(0)) {
        return BigInt(indexLocal) + _GLOBAL_INDEX_MAINNET_FLAG;
    } else {
        return (
            BigInt(indexLocal) + BigInt(sourceNetworkId - 1) * BigInt(2 ** 32)
        );
    }
}

export function buildPayloadForClaim(transactionHash, networkId, isRefuel) {
    return getBridgeLogData(transactionHash, networkId, isRefuel).then(
        (data) => {
            const {
                originNetwork,
                originTokenAddress,
                destinationNetwork,
                destinationAddress,
                amount,
                metadata,
                depositCount,
            } = data;

            return getProof(networkId, depositCount).then((proof) => {
                const payload = {
                    smtProof: proof.merkle_proof,
                    smtProofRollup: proof.rollup_merkle_proof,
                    globalIndex: computeGlobalIndex(
                        depositCount,
                        networkId
                    ).toString(),
                    mainnetExitRoot: proof.main_exit_root,
                    rollupExitRoot: proof.rollup_exit_root,
                    originNetwork: originNetwork,
                    originTokenAddress: originTokenAddress,
                    destinationNetwork: destinationNetwork,
                    destinationAddress: destinationAddress,
                    amount: amount,
                    metadata: metadata,
                };
                //console.log(payload);
                return payload;
            });
        }
    );
}

async function test() {
    console.log(
        await buildPayloadForClaim(
            "0xf95a82d1de2e647f0c01f5042ba080d60c9544bac2556654fd53e5c373c0d954",
            0,
            false
        )
    );
}

//test();
