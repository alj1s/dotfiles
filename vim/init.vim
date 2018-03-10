set nocompatible

filetype off

set rtp+=~/.local/lib/python2.7/site-packages/powerline/bindings/vim

let s:vimDir = $HOME.'/.vim'
let s:settings = s:vimDir.'/settings.vim'
let s:plugins = s:vimDir.'/plugins.vim'
let s:mappings = s:vimDir.'/mappings.vim'
let s:overrides = s:vimDir.'/overrides.vim'

let g:python2_host_prog = '/usr/local/bin/python'
let g:python3_host_prog = '/usr/local/bin/python3'

"source /usr/local/lib/python2.7/site-packages/powerline/bindings/vim/plugin/powerline.vim

exec ":source ".s:plugins
exec ":source ".s:settings
exec ":source ".s:mappings
exec ":source ".s:overrides
