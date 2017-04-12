" set the runtime path to include Vundle and initialize
call plug#begin()

Plug 'altercation/vim-colors-solarized'
Plug 'flazz/vim-colorschemes'
"Plug 'sheerun/vim-polyglot'
Plug 'editorconfig/editorconfig-vim'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-sensible'
Plug 'tpope/vim-surround'
Plug 'kien/ctrlp.vim'
Plug 'scrooloose/nerdtree'
"Plug 'scrooloose/syntastic'
Plug 'scrooloose/nerdcommenter'
Plug 'ximenean/anderson.vim'
Plug 'mattn/emmet-vim'
Plug 'junegunn/fzf'
Plug 'junegunn/vim-easy-align'
Plug 'rking/ag.vim'
Plug 'christoomey/vim-tmux-navigator'
Plug 'airblade/vim-gitgutter'
Plug 'SirVer/ultisnips'
Plug 'Valloric/YouCompleteMe'
Plug 'epilande/vim-es2015-snippets'
Plug 'epilande/vim-react-snippets'
Plug 'honza/vim-snippets'
Plug 'w0rp/ale'
"Plug 'isRuslan/vim-es6'
Plug 'vim-scripts/closetag.vim'
Plug 'herrbischoff/cobalt2.vim'
Plug 'wakatime/vim-wakatime'
Plug 'tiagofumo/vim-nerdtree-syntax-highlight'
Plug 'ryanoasis/vim-devicons'
Plug 'arcticicestudio/nord-vim'

call plug#end()

autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif

filetype plugin indent on

map <C-n> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

let g:EditorConfig_exec_path = 'usr/local/bin/editorConfig'
let g:EditorConfig_exclude_patterns = ['fugitive://.*']

"let g:syntastic_always_populate_loc_list = 1
"let g:syntastic_auto_loc_list = 1
"let g:syntastic_check_on_open = 1
"let g:syntastic_check_on_wq = 0

let g:jsx_ext_required = 0
"let g:syntastic_javascript_checkers = ['eslint']

let g:ag_prg="ag --vimgrep"
let g:ag_working_path_mode="r"

let g:UlitiSnipsExpandTrigger="<tab>"
let g:UltiSnipsJumpForwardTrigger="<c-b>"
let g:UltiSnipsJumpsBackwardTrigger="<c-z>"
let g:UltiSnipsEditSplit="vertical"

let g:ctrlp_working_path_mode = 'r'
let g:ctrlp_custom_ignore = 'node_modules'

let g:NERDTreeFileExtensionHighlightFullName = 1

xmap ga <Plug>(EasyAlign)
nmap ga <Plug>(EasyAlign)
