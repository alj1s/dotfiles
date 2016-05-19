" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'gmarik/Vundle.vim'
Plugin 'altercation/vim-colors-solarized'
Plugin 'flazz/vim-colorschemes'
Plugin 'sheerun/vim-polyglot'
"Plugin 'leafgarland/typescript-vim'
Plugin 'editorconfig/editorconfig-vim'
Plugin 'tpope/vim-fugitive'
Plugin 'tpope/vim-sensible'
Plugin 'tpope/vim-surround'
Plugin 'kien/ctrlp.vim'
"Plugin 'kien/rainbow_parentheses.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'scrooloose/syntastic'
Plugin 'scrooloose/nerdcommenter'
Plugin 'ximenean/anderson.vim'
Plugin 'mattn/emmet-vim'
Plugin 'junegunn/fzf'
Plugin 'rking/ag.vim'
Plugin 'christoomey/vim-tmux-navigator'
"Plugin 'pangloss/vim-javascript'
"Plugin 'mxw/vim-jsx'
Plugin 'airblade/vim-gitgutter'
Plugin 'SirVer/ultisnips'
Plugin 'honza/vim-snippets'
"Plugin 'godlygeek/csapprox'i "make gvim colorschemes work in the terminal
Plugin 'vim-scripts/closetag.vim'
Plugin 'herrbischoff/cobalt2.vim'
Plugin 'wakatime/vim-wakatime'


call vundle#end()
filetype plugin indent on

map <C-n> :NERDTreeToggle<CR>

let g:EditorConfig_exec_path = 'usr/local/bin/editorConfig'
let g:EditorConfig_exclude_patterns = ['fugitive://.*']

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0

let g:jsx_ext_required = 0
let g:syntastic_javascript_checkers = ['eslint']

let g:ag_prg="ag --vimgrep"
let g:ag_working_path_mode="r"

let g:UlitiSnipsExpandTrigger="<tab>"
let g:UltiSnipsJumpForwardTrigger="<c-b>"
let g:UltiSnipsJiumpsBackwardTrigger="<c-z>"

let g:UltiSnipsEditSplit="vertical"
 
let g:ctrlp_working_path_mode = 0
