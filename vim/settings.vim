"if has("nvim")
"    let $NVIM_TUI_ENABLE_TRUE_COLOR=1
"else
"set term=cons25
"endif

"set t_Co=256
"let g:solarized_termcolors=256
colorscheme cobalt

set relativenumber    "display line numbers relative to current position
set nu                "display line numbers

set showmatch         "show matching object (parens, comment etc)
set hlsearch          "highlight search term occurrences
set ignorecase        "ignore case when searching...
set smartcase         "... unless we use cases in the search term

set listchars=tab:>~,nbsp:_,trail:. "set display format of whitespace chars
set list                            "show whitespace chars (tabs, spaces etc)

set autoindent
set smartindent
set expandtab tabstop=2 shiftwidth=2 smarttab softtabstop=2

set textwidth=100
set colorcolumn=+1

set cursorline

set autochdir

syntax on
