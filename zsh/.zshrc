PACKAGE_BASE=`python3 -m site | grep USER_BASE | awk '{print $2}' | tr -d "'"`
PACKAGE_BIN=${PACKAGE_BASE}/bin

export PATH=$PACKAGE_BIN:/opt/homebrew/bin:$PATH

export XDG_DATA_HOME=$HOME/.local/share
export XDG_CONFIG_HOME=$HOME/.config
export XDG_STATE_HOME=$HOME/.local/state
export XDG_CACHE_HOME=$HOME/.cache
export XDG_RUNTIME_DIR=$UID

export DOCKER_CONFIG="$XDG_CONFIG_HOME"/docker

eval "$(zoxide init zsh)"
eval "$(starship init zsh)"
