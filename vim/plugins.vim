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
Plug 'kien/rainbow_parentheses.vim'
Plug 'scrooloose/nerdtree'
Plug 'scrooloose/nerdcommenter'
Plug 'ximenean/anderson.vim'
Plug 'mattn/emmet-vim'
Plug 'junegunn/fzf'
Plug 'junegunn/vim-easy-align'
Plug 'mileszs/ack.vim'
Plug 'christoomey/vim-tmux-navigator'
Plug 'airblade/vim-gitgutter'
Plug 'ervandew/supertab'
Plug 'SirVer/ultisnips'
Plug 'Valloric/YouCompleteMe'
Plug 'epilande/vim-es2015-snippets'
Plug 'epilande/vim-react-snippets'
Plug 'honza/vim-snippets'
Plug 'w0rp/ale'
"Plug 'isRuslan/vim-es6'
"Plug 'vim-syntastic/syntastic'
Plug 'vim-scripts/closetag.vim'
Plug 'herrbischoff/cobalt2.vim'
Plug 'wakatime/vim-wakatime'
Plug 'tiagofumo/vim-nerdtree-syntax-highlight'
Plug 'Xuyuanp/nerdtree-git-plugin'
Plug 'ryanoasis/vim-devicons'
Plug 'arcticicestudio/nord-vim'
Plug 'ternjs/tern_for_vim'
Plug 'majutsushi/tagbar'
Plug 'ludovicchabant/vim-gutentags'
Plug 'raichoo/purescript-vim'
Plug 'FrigoEU/psc-ide-vim'
Plug 'hecal3/vim-leader-guide'
Plug 'trevordmiller/nova-vim'
Plug 'sjl/gundo.vim'
Plug 'leafgarland/typescript-vim'
Plug 'wesQ3/vim-windowswap'
Plug 'matze/vim-move'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'othree/javascript-libraries-syntax.vim'
Plug 'reasonml-editor/vim-reason'
Plug 'benmills/vimux'
Plug 'karthikv/tradeship-vim'

call plug#end()

autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif

filetype plugin indent on

map <C-n> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

nmap <leader>f :NERDTreeFind<CR>

let NERDTreeShowHidden = 1

let g:EditorConfig_exec_path = 'usr/local/bin/editorConfig'
let g:EditorConfig_exclude_patterns = ['fugitive://.*']

"let g:syntastic_always_populate_loc_list = 1
"let g:syntastic_check_on_open = 1
"let g:syntastic_check_on_wq = 0

let g:jsx_ext_required = 0
"let g:syntastic_javascript_checkers = ['eslint']
"let g:syntastic_javascript_eslint_exe='$(npm bin)/eslint'
"
"" Asynchronous Lint Engine (ALE)
" Limit linters used for JavaScript.
let g:ale_linters = {
\  'javascript': ['flow', 'prettier', 'eslint']
\}
highlight clear ALEErrorSign " otherwise uses error bg color (typically red)
highlight clear ALEWarningSign " otherwise uses error bg color (typically red)
let g:ale_sign_error = 'X' " could use emoji
let g:ale_sign_warning = '?' " could use emoji
let g:ale_statusline_format = ['X %d', '? %d', '']
" %linter% is the name of the linter that provided the message
" %s is the error or warning message
let g:ale_echo_msg_format = '%linter% says %s'
" Map keys to navigate between lines with errors and warnings.
nnoremap <leader>an :ALENextWrap<cr>
nnoremap <leader>ap :ALEPreviousWrap<cr>

let g:user_emmet_leader_key='<Tab>'
let g:user_emmet_settings = {
  \  'javascript.jsx' : {
    \      'extends' : 'jsx',
    \  },
  \}

let g:ackprg = "ag --vimgrep --smart-case"

"let g:ag_prg="ag --vimgrep"
"let g:ag_working_path_mode="r"

let g:ycm_key_list_select_completion = ['<C-n>', '<Down>']
let g:ycm_key_list_previous_completion = ['<C-p>', '<Up>']
let g:SuperTabDefaultCompletionType = '<C-n>'

let g:UlitiSnipsExpandTrigger="<tab>"
let g:UltiSnipsJumpForwardTrigger="<tab>"
let g:UltiSnipsJumpsBackwardTrigger="<s-tab>"
let g:UltiSnipsEditSplit="vertical"
let g:UltiSnipsSnippetsDir = '~/.vim/ultisnips'
let g:UltiSnipssSnippetDirectories = ['ultisnips']

let g:ctrlp_match_window = 'bottom,order:ttb'
let g:ctrlp_switch_buffer = 0
let g:ctrlp_working_path_mode = 0
let g:ctrlp_user_command = 'ag %s -l --nocolor --hidden -g ""'

let g:NERDTreeFileExtensionHighlightFullName = 1

let s:brown = "905532"
let s:aqua =  "3AFFDB"
let s:blue = "689FB6"
let s:darkBlue = "44788E"
let s:purple = "834F79"
let s:lightPurple = "834F79"
let s:red = "8E2915"
let s:beige = "F5C06F"
let s:yellow = "F09F17"
let s:orange = "D4843E"
let s:darkOrange = "F16529"
let s:pink = "CB6F6F"
let s:salmon = "EE6E73"
let s:green = "8FAA54"
let s:lightGreen = "31B53E"
let s:white = "FFFFFF"
let s:rspec_red = 'FE405F'
let s:git_orange = 'F54D27'

let g:NERDTreeExtensionHighlightColor= {}
let g:NERDTreeExtensionHighlightColor['html'] = s:red
let g:NERDTreeExtensionHighlightColor['md'] = s:purple
let g:NERDTreeExtensionHighlightColor['json'] = s:yellow
let g:NERDTreeExtensionHighlightColor['css'] = s:brown
let g:NERDTreeExtensionHighlightColor['js'] = s:green
let g:NERDTreeExtensionHighlightColor['jsx'] = s:green

let g:airline_powerline_fonts = 1

xmap ga <Plug>(EasyAlign)
nmap ga <Plug>(EasyAlign)

nnoremap <leader>u: GundoToggle<CR>
nnoremap <leader>a: :Ack

let g:move_map_keys=0
vmap <C-j> <Plug>MoveBlockDown
vmap <C-k> <Plug>MoveBlockUp
nmap ∆ <Plug>MoveLineDown
nmap ˚ <Plug>MoveLineUp

map <leader>vp :VimuxPromptCommand<CR>
map <leader>vl :VimuxRunLastCommand<CR>
map <leader>f :NERDTreeFind<CR>

au VimEnter * RainbowParenthesesToggle
au Syntax * RainbowParenthesesLoadRound
au Syntax * RainbowParenthesesLoadSquare
au Syntax * RainbowParenthesesLoadBraces

"autocmd BufWritePre *.js Tradeship

"autocmd BufWinEnter * NERDTreeFind
