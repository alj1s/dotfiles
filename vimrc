set nocompatible
filetype off

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
Plugin 'rizzatti/dash.vim'

call vundle#end()

filetype plugin indent on

"execute pathogen#infect()
syntax on
set background=dark
colorscheme solarized
set relativenumber
set nu

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
