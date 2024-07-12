import { createPublicClient, http } from "viem";
import { astarZkEVM } from "viem/chains";
import PolygonZkEVMBridge from "./ABIs/PolygonZkEVMBridge";

const BRIDGE_ADDRESS = "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe";

const client = createPublicClient({
    chain: astarZkEVM,
    transport: http(),
});

const data = await client.readContract({
    address: BRIDGE_ADDRESS,
    abi: PolygonZkEVMBridge,
    functionName: "isClaimed",
    args: [51269, 1],
});

console.log(data);
