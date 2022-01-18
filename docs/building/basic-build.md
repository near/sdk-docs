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

You can find an example [here](https://github.com/near/near-sdk-rs/blob/05e4539a8f3db86dd43b768ee9660dd4c8e7ea5c/examples/fungible-token/.cargo/config.toml).


# Building Multiple Contracts

When building multiple contracts, you will want to take advantage of the workspaces function of Cargo.toml. Supposed we have two contracts that we want to build, "foo" and "bar". We would update the structure of our project to reflect these multiple contracts:

```bash
.
├── Cargo.lock  ⟵ created during build to lock dependencies
├── Cargo.toml
├── foo
│  └── Cargo.toml  
│  └── src
│       └── lib.rs
├── bar
│  └── Cargo.toml  
│  └── src
│       └── lib.rs
└── target      ⟵ created during build, holds the compiled wasm
```

The Cargo.toml at the root will deine overall build settings for all of the workspace contracts

```
[profile.release]
codegen-units = 1
# Tell `rustc` to optimize for small code size.
opt-level = "z"
lto = true
debug = false
panic = "abort"
# Opt into extra safety checks on arithmetic operations https://stackoverflow.com/a/64136471/249801
overflow-checks = true

[workspace]
members = [
    "foo",
    "bar"
]
```

In the Cargo.toml in the workspace directories, include the specific properties for that workspace:

For the Cargo.toml in the foo workspace (under the foo directory)

```
[package]
name = "foo"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
near-sdk = "3.1.0"

[lib]
crate-type = ["cdylib"]
```

Similarly in the Cargo.toml in the bar workspace (under the bar directory)

```
[package]
name = "bar"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
near-sdk = "3.1.0"

[lib]
crate-type = ["cdylib"]
```

When you perform a build, both of the .wasm files for the contracts will be generated to the target/release directory if the builds are successful. The cargo command for performing the build does not change:

```
cargo build --target wasm32-unknown-unknown --release
```

You can find an example [here](https://github.com/miohtama/advanced-fungible).
