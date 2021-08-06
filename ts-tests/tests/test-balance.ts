import { expect } from "chai";
import { step } from "mocha-steps";

import { createAndFinalizeBlock, describeWithFrontier, customRequest } from "./util";

describeWithFrontier("Frontier RPC (Balance)", (context) => {
	const GENESIS_ACCOUNT = "0xd43593c715fdd31c61141abd04a99fd6822c8558";
	const GENESIS_ACCOUNT_BALANCE = "340282366920938463463374607431768211455";
	const GENESIS_ACCOUNT_PRIVATE_KEY = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a";
	const TEST_ACCOUNT = "0x1111111111111111111111111111111111111111";

	step("genesis balance is setup correctly", async function () {
		expect(await context.web3.eth.getBalance(GENESIS_ACCOUNT)).to.equal(GENESIS_ACCOUNT_BALANCE);
	});

	step("balance to be updated after transfer", async function () {
		this.timeout(15000);

		const tx = await context.web3.eth.accounts.signTransaction({
			from: GENESIS_ACCOUNT,
			to: TEST_ACCOUNT,
			value: "0x200", // Must me higher than ExistentialDeposit (500)
			gasPrice: "0x01",
			gas: "0x100000",
		}, GENESIS_ACCOUNT_PRIVATE_KEY);
		await customRequest(context.web3, "eth_sendRawTransaction", [tx.rawTransaction]);
		await createAndFinalizeBlock(context.web3);
		expect(await context.web3.eth.getBalance(GENESIS_ACCOUNT)).to.equal("340282366920938463463374607431768189943");
		expect(await context.web3.eth.getBalance(TEST_ACCOUNT)).to.equal("512");
	});
});
