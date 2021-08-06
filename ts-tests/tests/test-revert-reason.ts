import { expect } from "chai";

import ExplicitRevertReason from "../build/contracts/ExplicitRevertReason.json"
import { createAndFinalizeBlock, customRequest, describeWithFrontier } from "./util";
import { AbiItem } from "web3-utils";

describeWithFrontier("Frontier RPC (Revert Reason)", (context) => {

	let contractAddress;

	const GENESIS_ACCOUNT = "0xd43593c715fdd31c61141abd04a99fd6822c8558";
	const GENESIS_ACCOUNT_PRIVATE_KEY = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a";
	const REVERT_W_MESSAGE_BYTECODE = ExplicitRevertReason.bytecode;

	const TEST_CONTRACT_ABI= ExplicitRevertReason.abi as AbiItem[];

	before("create the contract", async function () {
		this.timeout(15000);
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				data: REVERT_W_MESSAGE_BYTECODE,
				value: "0x00",
				gasPrice: "0x01",
				gas: "0x100000",
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);
		const r = await customRequest(context.web3, "eth_sendRawTransaction", [tx.rawTransaction]);
		await createAndFinalizeBlock(context.web3);
		const receipt = await context.web3.eth.getTransactionReceipt(r.result);
		contractAddress = receipt.contractAddress;
	});

	it("should fail with revert reason", async function () {
		const contract = new context.web3.eth.Contract(TEST_CONTRACT_ABI, contractAddress, {
			from: GENESIS_ACCOUNT,
			gasPrice: "0x01",
		});
		try {
			await contract.methods.max10(30).call();
		} catch (error) {
			expect(error.message).to.be.eq(
				"Returned error: VM Exception while processing transaction: revert Value must not be greater than 10."
			);
		}
	});
});
