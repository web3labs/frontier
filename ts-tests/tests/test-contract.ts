import { expect } from "chai";

import Test from "../build/contracts/Test.json"
import { createAndFinalizeBlock, customRequest, describeWithFrontier } from "./util";

describeWithFrontier("Frontier RPC (Contract)", (context) => {
	const GENESIS_ACCOUNT = "0xd43593c715fdd31c61141abd04a99fd6822c8558";
	const GENESIS_ACCOUNT_PRIVATE_KEY = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a";

	const TEST_CONTRACT_BYTECODE = Test.bytecode;
	const TEST_CONTRACT_DEPLOYED_BYTECODE = Test.deployedBytecode
	const FIRST_CONTRACT_ADDRESS = "0xc2bf5f29a4384b1ab0c063e1c666f02121b6084a";
	// Those test are ordered. In general this should be avoided, but due to the time it takes
	// to spin up a frontier node, it saves a lot of time.

	it("contract creation should return transaction hash", async function () {
		this.timeout(15000);
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				data: TEST_CONTRACT_BYTECODE,
				value: "0x00",
				gasPrice: "0x01",
				gas: "0x100000",
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);

		expect(await customRequest(context.web3, "eth_sendRawTransaction", [tx.rawTransaction])).to.include({
			id: 1,
			jsonrpc: "2.0",
		});

		// Verify the contract is not yet stored
		expect(await customRequest(context.web3, "eth_getCode", [FIRST_CONTRACT_ADDRESS])).to.deep.equal({
			id: 1,
			jsonrpc: "2.0",
			result: "0x",
		});

		// Verify the contract is stored after the block is produced
		await createAndFinalizeBlock(context.web3);
		expect(await customRequest(context.web3, "eth_getCode", [FIRST_CONTRACT_ADDRESS])).to.deep.equal({
			id: 1,
			jsonrpc: "2.0",
			result:
			TEST_CONTRACT_DEPLOYED_BYTECODE,
		});
	});
});
