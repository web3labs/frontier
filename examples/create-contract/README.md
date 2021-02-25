# Contract Creation Examples

The following content is an example in how to get an ethereum contract deployed in a substrate-based chain.

For that purpose, following things must be ready.

- The contract! Simple Storage contract will be used for keeping things simple. Find the source [here](./resources/SimpleStorage.sol)
- Substrate Account, migth seem obvious but remarking this now will make more sense as you keep on reading this. **Alice** account will be the one used.
```
$ subkey inspect /Alice
Secret Key URI `/Alice` is account:
  Secret seed:      n/a
  Public key (hex): 0xd6c71059dbbe9ad2b0ed3f289738b800836eb425544ce694825285b958ca755e
  Account ID:       0xd6c71059dbbe9ad2b0ed3f289738b800836eb425544ce694825285b958ca755e
  SS58 Address:     5GvKEoc787uDV8etY1AM8vF385edu2iyqD1WfCjDugzLUiAL

```
- Substrate node. Is assumed that a [Frontier](https://github.com/paritytech/frontier) node is already configured.

Allright! The next step will be look for what extrinsics does the [evm-pallet](https://github.com/paritytech/frontier/blob/master/docs/frame/evm.md) provide to create our contract. Reading through [pallet documentation](https://substrate.dev/rustdocs/v2.0.0/pallet_evm/index.html) the dispatchable call `create(H160, Vec<u8>, U256, u32, U256, Option<U256>)` shows up, this call issues an EVM create operation. This is similar to a contract creation transaction in Ethereum. Therefore will be the one used. 

Having a look into the source of the pallet, the create function is implemented as follows

```
		fn create(
			origin,
			source: H160,
			init: Vec<u8>,
			value: U256,
			gas_limit: u32,
			gas_price: U256,
			nonce: Option<U256>,
		) -> DispatchResultWithPostInfo {

			/// implementation
		}
```

Here is a brief description of each parameter
- **origin** refers to the substrate account sending the extrinsic
- **source** is the evm account used in the creating of the contract.
- **value** the value we want to send withing this transaction, for a regular contract creation doesn't makes much sense to have other value than 0.
- **gas_limit** the maximum amount of gas available for the creation. We have to be sure of allowing enough gas usage for the contract to be created. (Deploying the contract in a test enviroment beforehand can give a hint of this value)
- **gas_price** the value we are willing to pay for each unit of gas.
_ **nonce** is optional, but the possibility of inputing it exists. By default `source` account `nonce` will be pulled if not provided.

This process may seem very straight froward, the main question that can appear now is, how do I know which `source` account to use ?

A very direct way of solving this problem is looking into the implementation of the function create for some type of origin checking like the following:
```
			T::CallOrigin::ensure_address_origin(&source, origin)?;
```

And having evidence that there is some `origin` checking, will be nice to know how is this origin being checked, for that looking for the `pallet_evm::Config` implementation in the [runtime](https://github.com/paritytech/frontier/blob/master/template/runtime/src/lib.rs#L290):

```
		type CallOrigin = EnsureAddressTruncated;
```

So, in this case, using frontier master branch node, `source` will be checked expecting from it a truncated version of `origin`. So _substrate_ Alice will have to sign an extrinsic where her account will be the `origin` and _evm_ Alice account will be appear as `source`, but truncated to the required length.

**What length does truncated implies ?**

Take into account that the type of `source` is `H160`. Hash of 160 bit length, that transaltes into a 42 (40 + '0x') characters long hex representation of the public id of Alice.

- [Polkadot{.js} Apps](https://polkadot.js.org/apps/)

**No funds ?**

If you find that Alice account has not enough balance for deploying the contract it might be helpful defining some initial balance in the *genesis* of our chain, like so in our `chain_spec.rs` genesis config.

```rust

<-- snip -->

let alice_evm_account_id = H160::from_str("d43593c715fdd31c61141abd04a99fd6822c8558").unwrap();
        let mut evm_accounts = BTreeMap::new();
        evm_accounts.insert(
                alice_evm_account_id,
                pallet_evm::GenesisAccount {
                        nonce: 0.into(),
                        balance: U256::from(123456_123_000_000_000_000_000u128),
                        storage: BTreeMap::new(),
                        code: vec![],
                },
        );

<-- snip -->

GenesisConfig {

<-- snip -->

	pallet_evm: Some(EVMConfig {
		accounts: evm_accounts
	}),

<-- snip -->

}

```
