---
sidebar_position: 1
---

# Basic instructions
To compile release version of the smart contract you can run:

```bash
cargo build --target wasm32-unknown-unknown --release
```

> **Note:** The above `build` command is setting a `target` flag to create a WebAssembly `.wasm` file.

Notice that your project directory now has a few additional items:

```bash
.
├── Cargo.lock  ⟵ created during build to lock dependencies
├── Cargo.toml
├── src
│  └── lib.rs
└── target      ⟵ created during build, holds the compiled wasm
```
# Build and Flags
We recommend you to optimize your build artifact with the use of the next flags.

```bash
env 'RUSTFLAGS=-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
```

The above command is essentially setting special flags and optimizing the resulting `.wasm` file. At the end of the day, it's simply a customized `cargo build --release` command.


**Windows users**: please modify the above command as:
```bash
set RUSTFLAGS=-C link-arg=-s
cargo build --target wasm32-unknown-unknown --release
```

You can simpify this command by adding this flags to your `ProjectFolder/.cargo/config.toml`.

```toml
[target.wasm32-unknown-unknown]
rustflags = ["-C", "link-arg=-s"]
```

You can find an example [here](https://github.com/near/near-sdk-rs/blob/072b47779fcb219f468977bd7e727b4a83d9bd44/examples/fungible-token/.cargo/config.toml).