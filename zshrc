export JAVA_HOME=$(/usr/libexec/java_home)
export PATH=$JAVA_HOME/bin:$HOME/bin:/usr/local/bin:$PATH
export ANDROID_HOME=~/Library/Android/sdk
export PATH=${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
export PATH="$PATH:$HOME/Library/Python/2.7/bin"
export PATH="$PATH:$HOME/dev/flutter/bin"

. /usr/local/etc/profile.d/z.sh

export TERM="xterm-256color"
export NVM_DIR="$HOME/.nvm"
. "/usr/local/opt/nvm/nvm.sh"

autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc

# Path to your oh-my-zsh installation.
export ZSH=$HOME/.oh-my-zsh

fyi() {
  curl cli.fyi/$1
}


# Set name of the theme to load. Optionally, if you set this to "random"
# it'll load a random theme each time that oh-my-zsh is loaded.
# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
POWERLEVEL9K_MODE='nerdfont-complete'
ZSH_THEME="powerlevel9k/powerlevel9k"
POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(vi_mode dir vcs)
POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(root_indicator background_jobs node_version history time)
POWERLEVEL9K_PROMPT_ON_NEWLINE=true
POWERLEVEL9K_MULTILINE_LAST_PROMPT_PREFIX="%{%F{249}%}\u2517%{%F{default}%} \u03bb "

# Uncomment the following line to enable command auto-correction.
 ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
 COMPLETION_WAITING_DOTS="true"


# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  git
  git-extras
  node
  yarn
  npm
  jsontools
  history-substring-search
  zsh-autosuggestions
  brew
  wakatime
)

source $ZSH/oh-my-zsh.sh
source $HOME/git.sh
#. /usr/local/lib/python2.7/site-packages/powerline/bindings/zsh/powerline.zsh

# User configuration

export EDITOR='nvim'
export SBT_OPTS="-Xms1G -Xmx4G"

# ssh
export SSH_KEY_PATH="~/.ssh/rsa_id"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"
alias rni="react-native run-ios"
alias rna="react-native run-android"
alias rns="react-native start --reset-cache"
alias rkwm="brew services restart chunkwm"

alias ta="tmux attach -t"
alias tn="tmux new -s"
alias tl="tmux ls"

alias l="exa --all --long --color=always --group-directories-first"
alias ls="colorls"
alias la="ls -la"

alias cat="bat"
alias ping="prettyping --nolegend"
alias top="htop"

alias vim="nvim"
alias flushdns="sudo dscacheutil -flushcache"

source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

neofetch
