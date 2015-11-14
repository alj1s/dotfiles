set nocompatible
filetype off

python from powerline.vim import setup as powerline_setup
python powerline_setup()
python del powerline_setup

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'gmarik/Vundle.vim'
Plugin 'derekwyatt/vim-scala'
Plugin 'altercation/vim-colors-solarized'
Plugin 'tpope/vim-sensible'
Plugin 'flazz/vim-colorschemes'
Plugin 'leafgarland/typescript-vim'
Plugin 'editorconfig/editorconfig-vim'
Plugin 'tpope/vim-fugitive'
Plugin 'kien/ctrlp.vim'
Plugin 'kien/rainbow_parentheses.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'scrooloose/syntastic'
Plugin 'rizzatti/dash.vim'
Plugin 'gilgigilgil/anderson.vim'
Plugin 'mattn/emmet-vim'


call vundle#end()

filetype plugin indent on

"execute pathogen#infect()
syntax on
set background=dark
set relativenumber
set nu

set showmatch

colorscheme anderson

set listchars=tab:>~,nbsp:_,trail:.
set list

set autoindent
set smartindent
set expandtab tabstop=2 shiftwidth=2 smarttab softtabstop=2

set textwidth=80
set colorcolumn=+1

nnoremap ; :
map q <Nop>

let g:EditorConfig_exec_path = 'usr/local/bin/editorConfig'
let g:EditorConfig_exclude_patterns = ['fugitive://.*']

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0
