# source this before building: puts the pinned Python tools first and tells HyperFrames which Python to use.
OPS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$OPS/.venv/bin:$PATH"
export HYPERFRAMES_PYTHON="$OPS/.venv/bin/python3"
export NODE_PATH="$(npm root -g 2>/dev/null)${NODE_PATH:+:$NODE_PATH}"
