#!/bin/bash
# OMNIS APIEN WASM 构建脚本

set -e

echo "Building OMNIS APIEN WASM modules..."

# 检查 Rust 环境
if ! command -v rustc &> /dev/null; then
    echo "Error: Rust is not installed"
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# 检查 wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# 切换到 wasm 目录
cd "$(dirname "$0")"

# 清理之前的构建
echo "Cleaning previous builds..."
cargo clean

# 构建所有模块
echo "Building release version..."
wasm-pack build --target web --out-dir ../src/wasm --release

# 如果构建成功
if [ $? -eq 0 ]; then
    echo ""
    echo "Build successful!"
    echo "WASM modules are in: ../src/wasm/"
    echo ""
    echo "Generated files:"
    ls -la ../src/wasm/*.js ../src/wasm/*.wasm 2>/dev/null || echo "No output files found"
else
    echo "Build failed!"
    exit 1
fi
