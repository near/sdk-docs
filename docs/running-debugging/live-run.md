---
sidebar_position: 1
---

# Run Contract Locally or on Testnet

<!-- Instructions on setting up local node -->
## Run a contract locally
### Set up a local node
You can use `nearup` to launch a NEAR nodes to a `localnet`, `betanet`, or `testnet`. You can use local nodes to deploy and debug your smart contracts on localhost.

#### Install nearup
Python3 and pip are required to use `nearup`. pyenv makes it easy and convenient to manage Python environments, so it is recommended to [install pyenv](https://github.com/pyenv/pyenv#installation) and operate your nodes in a pyenv environment.

Once pyenv is installed, use it to create a virtual environment for NEAR, and install `nearup` to that environment.
    
    pyenv install 3.9.1
    pyenv virtualenv 3.9.1 near
    pyenv activate near
    pip install nearup
    which nearup
    # Should look like ~/.pyenv/shims/nearup

#### Install near-cli
Follow [instructions to install near-cli](https://docs.near.org/docs/tools/near-cli#setup).

#### Compile nearcore
In order to launch a NEAR network locally, you'll need to compile `nearcore` locally, and configure `near-cli` to use local endpoints by setting the environment variable `NEAR_ENV`.

    mkdir $HOME/near && cd $HOME/near
    git clone git@github.com:near/nearcore.git
    cd nearcore
    make neard
    export near_target_path=$HOME/near/nearcore/target/release
    export NEAR_ENV=local
    nearup run localnet --binary-path $near_target_path

**Congrats!** You've launched a local instance of the NEAR network and configured `near-cli` to interact with your network.

By default, this will spawn four nodes validating in a single shard. RPC ports of each node will increase consecutively, starting with 3030. Access the 3030 node's status by http://localhost:3030/status. Replace "3030" with a given node's port to see its status.


<!-- Deploy contract through CLI/RPC -->
### Deploy and call a contract using `near-cli`
Now that you've launched a local NEAR network, let's deploy a contract to it! The sample application simply sends NEAR from one user to another. First, clone the sample application.

    cd $HOME/near
    git clone git@github.com:near-examples/TODO.git
    cd TODO
    cargo build --target wasm32-unknown-unknown --release

This compiles your contract and creates a `.wasm` file at `$HOME/near/TODO/target/wasm32-unknown-unknown/contract.wasm`. Now you'll need to create users to execute the contract against.

    near create-account alice.node0 --masterAccount node0
    near create-account bob.node0 --masterAccount node0

:::info What's node0?
`nearup localnet run` populates a directory for each node you spin up. For example: `~/.near/localnet/`. Here you'll find several files, including a `config.json` and `validator_key.json`. It's probably not necessary, but if you're curious, you can take some time and explore these files.
:::

Before you deploy the contract, consider playing around with `near-cli`.

    # See information on alice's account
    near state alice.node0
    
    # See information on bob's account
    near state bob.node0 
    
    # Send 1 NEAR from alice to bob
    near send alice.node0 bob.node0 1 
    
    # See updated information on alice's account
    near state alice.node0
    
    # See updated information on bob's account
    near state bob.node0 

Okay, now it's time to deploy your contract.

    # Create account for the contract and deploy the contract
    near create-account contract.node0 --masterAccount node0
    near deploy --accountId contract.node0 --wasmFile $HOME/near/TODO/target/wasm32-unknown-unknown/contract.wasm --initFunction "new" --initArgs '{}'

`near deploy` deploys a smart contract to the blockchain.
- `--accountId` is the NEAR account that the contract will be deployed to.
- `--wasmFile` is the path to the smart contract to be deployed.
- `--initFunction` is the initialization function of the contract `Struct`
- `--initArgs` are the arguments passed to the `initFunction`; in this case, there are no arguments required by the contract.

Finally, execute the contract.

    near call contract.node0 send_near '{"receiver_id": "bob.node0", "amount_to_send": 100000000000000000000}' --accountId alice.node0

`near call` invokes a method of a smart contract that exists the blockchain.
- `contract.node0` is the account id to which the contract is deployed.
- `send_near` is the name of the method that is being called.
- The json string represents the arguments passed to the method being called. `send_near` takes two arguments:
  - `receiver_id`: a `String`, the account id of the user receiving funds
  - `amount_to_send`: a `u128`, the amount of NEAR to send, in yoctoNEAR (the smallest unit of NEAR, 10^-24)
- `--accountId` is the account id of the user [signing the transaction](https://docs.near.org/docs/concepts/transaction#transaction).

Confirm that alice's account balance decreased, and bob's account balance increased.

    near state alice.node0
    near state bob.node0

**Congrats!** You've deployed and executed a contract on your local network!

Enter `nearup stop` to tear down your network.


<!-- How to run commands on testnet rather than local node -->

## Promote your contract to testnet

TODO
