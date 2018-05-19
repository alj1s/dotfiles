set rtp+=~/.vim
colorscheme nord

set relativenumber    "display line numbers relative to current position
set nu                "display line numbers

set foldmethod=indent
set showmatch         "show matching object (parens, comment etc)
set hlsearch          "highlight search term occurrences
set ignorecase        "ignore case when searching...
set smartcase         "... unless we use cases in the search term

set listchars=tab:>~,nbsp:_,trail:. "set display format of whitespace chars
set list                            "show whitespace chars (tabs, spaces etc)

set autoindent
set smartindent
set expandtab tabstop=2 shiftwidth=2 smarttab softtabstop=2

if !has('nvim')
  set term=builtin_ansi
endif

set textwidth=100
set colorcolumn=+1

set showcmd
set cursorline

let mapleader=","

set undofile
set undodir=~/.vim/undo

syntax on
