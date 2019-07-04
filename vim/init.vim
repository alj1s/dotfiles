call plug#begin()
"Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
"Plug 'SirVer/ultisnips'
Plug 'Xuyuanp/nerdtree-git-plugin'
Plug 'airblade/vim-gitgutter'
Plug 'arcticicestudio/nord-vim'
"Plug 'carlitux/deoplete-ternjs', { 'for': ['javascript', 'javascript.jsx'] }
Plug 'christoomey/vim-tmux-navigator'
Plug 'ctrlpvim/ctrlp.vim'
Plug 'epilande/vim-es2015-snippets'
Plug 'epilande/vim-react-snippets'
Plug 'honza/vim-snippets'
Plug 'jbgutierrez/vim-better-comments'
Plug 'mattn/emmet-vim'
Plug 'matze/vim-move'
Plug 'mileszs/ack.vim'
Plug 'othree/jspc.vim', { 'for': ['javascript', 'javascript.jsx'] }
Plug 'prettier/vim-prettier', { 'do': 'yarn install' }
Plug 'rizzatti/dash.vim'
Plug 'scrooloose/nerdcommenter'
Plug 'scrooloose/nerdtree'
Plug 'shmargum/vim-sass-colors'
Plug 'sheerun/vim-polyglot'
Plug 'ternjs/tern_for_vim', { 'do': 'npm install && npm install -g tern', 'for': ['javascript', 'javascript.jsx'] }
Plug 'tiagofumo/vim-nerdtree-syntax-highlight'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-surround'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
"Plug 'w0rp/ale'
Plug 'neoclide/coc.nvim', { 'do': { -> coc#util#install()}}
Plug 'Shougo/denite.nvim'
Plug 'wakatime/vim-wakatime'
Plug 'ryanoasis/vim-devicons' "should be specified last
call plug#end()

set colorcolumn=+1
set cursorline
set directory=$HOME/.vim/swapfiles  "keep swapfiles out of working directory
set encoding=UTF-8
set expandtab tabstop=2 shiftwidth=2 smarttab softtabstop=2
set foldmethod=indent
set hlsearch          "highlight search term occurrences
set ignorecase        "ignore case when searching...
set list                            "show whitespace chars (tabs, spaces etc)
set listchars=tab:>~,nbsp:_,trail:. "set display format of whitespace chars
set nu                              "display line numbers"
set relativenumber                  "display line numbers relative to current position"
set showmatch         "show matching object (parens, comment etc)
set smartcase         "... unless we use cases in the search term
set textwidth=100
set undodir=$HOME/.vim/undo
set undofile

colorscheme nord
highlight Comment ctermfg=yellow

let mapleader = ","

let g:user_emmet_settings = {
\  'javascript' : {
\      'extends' : 'jsx',
\  },
\  'typescript' : {
\      'extends' : 'tsx',
\  },
\}

let g:airline_powerline_fonts = 1

let g:ackprg = "ag --vimgrep ==smart-case"

let g:prettier#autoformat = 0
let g:prettier#config#arrow_parens = 'avoid'
let g:prettier#config#bracket_spacing = 'true'
let g:prettier#config#jsx_bracket_same_line = 'false'
let g:prettier#config#print_width = 80
let g:prettier#config#semi = 'true'
let g:prettier#config#single_quote = 'false'
let g:prettier#config#tab_width = 2
let g:prettier#config#trailing_comma = 'none'
let g:prettier#config#use_tabs = 'false'

let g:bettercomments_language_aliases = { 'javascript': 'js' }

"let g:deoplete#enable_at_startup = 1
"let g:deoplete#omni#functions = {}
"let g:deoplete#omni#functions.javascript = [
"  \ 'tern#Complete',
"  \ 'jspc#omni'
"\]

"let g:deoplete#sources#ternjs#types = 1
"let g:deoplete#sources#ternjs#docs = 1

"set completeopt=longest,menuone,preview
"let g:deoplete#sources = {}
"let g:deoplete#sources['javascript.jsx'] = ['file', 'ultisnips', 'ternjs']
"let g:tern#command = ['tern']
"let g:tern#arguments = ['--persistent']

let g:UltiSnipsEditSplit = "vertical"

"let g:ale_linters = {
"\  'javascript': ['flow', 'prettier', 'eslint']
"\}
"highlight clear ALEErrorSign " otherwise uses error bg color (typically red)
"highlight clear ALEWarningSign " otherwise uses error bg color (typically red)
"let g:ale_sign_error = 'X' " could use emoji
"let g:ale_sign_warning = '?' " could use emoji
"let g:ale_statusline_format = ['X %d', '? %d', '']
"let g:ale_fix_on_save = 1
"let g:ale_lint_on_text_changed = 'always'
"let g:ale_lint_delay = 1000

" use nice symbols for errors and warnings
"let g:ale_sign_error = '✗'
"let g:ale_sign_warning = '⚠'

" fixer configurations
"let g:ale_fixers = {
"\   'javascripjavascript': ['remove_trailing_lines', 'trim_whitespace'],
"\}
" %linter% is the name of the linter that provided the message
" %s is the error or warning message
"let g:ale_echo_msg_format = '%linter% says %s'

let g:ctrlp_match_window = 'bottom,order:ttb'
let g:ctrlp_switch_buffer = 0
let g:ctrlp_working_path_mode = 0
let g:ctrlp_user_command = 'ag %s -l --nocolor --hidden -g ""'

let s:brown = "D08770"
let s:aqua =  "8FBCBB"
let s:purple = "B48EAD"
let s:red = "BF616A"
let s:yellow = "EBCB8B"

let g:NERDTreeExtensionHighlightColor= {}
let g:NERDTreeExtensionHighlightColor['css'] = s:brown
let g:NERDTreeExtensionHighlightColor['ejs'] = s:aqua
let g:NERDTreeExtensionHighlightColor['html'] = s:red
let g:NERDTreeExtensionHighlightColor['js'] = s:aqua
let g:NERDTreeExtensionHighlightColor['json'] = s:yellow
let g:NERDTreeExtensionHighlightColor['jsx'] = s:aqua
let g:NERDTreeExtensionHighlightColor['log'] = s:aqua
let g:NERDTreeExtensionHighlightColor['md'] = s:purple
let g:NERDTreeExtensionHighlightColor['sh'] = s:brown

let g:NERDTreeFileExtensionHighlightFullName = 1 "vim-nerdtree-syntax-highlight
let NERDTreeMinimalUI = 1 "Hide the Press ? for help
let NERDTreeShowHidden = 1

let g:ErrorBetterComments = s:red

" === Coc.nvim === "
 " use <tab> for trigger completion and navigate to next complete item
function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~ '\s'
endfunction

inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()


nmap <silent> <leader>dd <Plug>(coc-definition)
nmap <silent> <leader>dr <Plug>(coc-references)
nmap <silent> <leader>dj <Plug>(coc-implementation)


" Custom options for Denite
"   auto_resize             - Auto resize the Denite window height automatically.
"   prompt                  - Customize denite prompt
"   direction               - Specify Denite window direction as directly below current pane
"   winminheight            - Specify min height for Denite window
"   highlight_mode_insert   - Specify h1-CursorLine in insert mode
"   prompt_highlight        - Specify color of prompt
"   highlight_matched_char  - Matched characters highlight
"   highlight_matched_range - matched range highlight
let s:denite_options = {'default' : {
 \ 'auto_resize': 1,
 \ 'prompt': 'λ:',
 \ 'direction': 'rightbelow',
 \ 'winminheight': '10',
 \ 'highlight_mode_insert': 'Visual',
 \ 'highlight_mode_normal': 'Visual',
 \ 'prompt_highlight': 'Function',
 \ 'highlight_matched_char': 'Function',
 \ 'highlight_matched_range': 'Normal'
 \ }}

nnoremap <silent> <leader>sv :so $MYVIMRC<CR>
nnoremap <silent> <leader>ev :e $MYVIMRC<CR>
nnoremap <leader>f :NERDTreeFind<CR>
nnoremap <silent> <esc> :noh<CR>
noremap <C-n> :NERDTreeToggle<CR>

" === Denite shorcuts === "
" "   ;         - Browser currently open buffers
" "   <leader>t - Browse list of files in current directory
" "   <leader>g - Search current directory for occurences of given term and
" "   close window if no results
" "   <leader>j - Search current directory for occurences of word under cursor
nmap ; :Denite buffer -split=floating -winrow=1<CR>
nmap <leader>t :Denite file/rec -split=floating -winrow=1<CR>
nnoremap <leader>g :<C-u>Denite grep:. -no-empty -mode=normal<CR>
nnoremap <leader>j :<C-u>DeniteCursorWord grep:. -mode=normal<CR>

autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif

autocmd BufWritePre *.js,*.jsx,*.mjs,*.ts,*.tsx,*.css,*.less,*.scss,*.json,*.graphql,*.md,*.vue PrettierAsync
autocmd BufWritePre .babelrc,.eslintrc,.prettierrc PrettierAsync
autocmd BufEnter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif
