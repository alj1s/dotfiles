export ZSH=$HOME/.oh-my-zsh
export SBT_OPTS='-Xms512M -Xmx2048M'
#ZSH_THEME="cobalt2"

# Uncomment the following line to enable command auto-correction.
ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
COMPLETION_WAITING_DOTS="true"

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
plugins=(git brew npm)

#source $ZSH/oh-my-zsh.sh
source "$HOME/.antigen/antigen.zsh"

antigen use oh-my-zsh
antigen bundle arialdomartini/oh-my-git
antigen bundle zsh-users/zsh-syntax-highlighting
#antigen theme ximenean/oh-my-git-themes oppa-lana-style

antigen-apply

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/X11/bin"

eval $(thefuck --alias)

. `brew --prefix`/etc/profile.d/z.sh

export PATH="/usr/local/lib/python2.7/site-packages:$PATH"
powerline-daemon -q
. /usr/local/lib/python2.7/site-packages/powerline/bindings/zsh/powerline.zsh
### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"
export EDITOR=vim

export NVM_DIR="/Users/andrewjones/.nvm"
export PATH="$NVM_DIR:$PATH"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

test -e "${HOME}/.iterm2_shell_integration.zsh" && source "${HOME}/.iterm2_shell_integration.zsh"
