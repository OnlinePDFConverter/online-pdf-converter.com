# Build Instructions for Ghostscript WASM

These files constitute the "Corresponding Source" build scripts required by the AGPL license.

## Prerequisites

- Linux environment (or WSL)
- Emscripten SDK (latest)
- `git`, `make`, `autoconf`, `gcc`

## Build Steps

1.  **Obtain Ghostscript Source**:
    Clone the GhostPDL repository into a directory named `ghostpdl` alongside these scripts.

2.  **Run Build Script**:
    Execute the provided `build.sh` script.
    ```bash
    ./build.sh
    ```

    This script will:
    - Configure Ghostscript for Emscripten build.
    - Compile the WASM binary.
    - Output `gs.wasm` and `gs.js` to a `dist` directory.

## File Descriptions

-   `build.sh`: The main build script calling `emcc` and `make`.
-   `optimize.sh`: Helper script for WASM optimization.
-   `.github/workflows`: The CI workflow definitions used to produce the released binary.
