" Map leader to which_key
nnoremap <silent> <leader> :silent WhichKey '<Space>'<CR>
vnoremap <silent> <leader> :silent <c-u> :silent WhichKeyVisual '<Space>'<CR>

" Create map to add keys to
let g:which_key_map =  {}
" Define a separator
let g:which_key_sep = '→'
" set timeoutlen=100

" Not a fan of floating windows for this
let g:which_key_use_floating_win = 0

" Change the colors if you want
highlight default link WhichKey          Operator
highlight default link WhichKeySeperator DiffAdded
highlight default link WhichKeyGroup     Identifier
highlight default link WhichKeyDesc      Function

" Hide status line
autocmd! FileType which_key
autocmd  FileType which_key set laststatus=0 noshowmode noruler
  \| autocmd BufLeave <buffer> set laststatus=2 noshowmode ruler

" Single mappings
" let g:which_key_map['/'] = [ '<Plug>NERDCommenterToggle'  , 'comment' ]
let g:which_key_map['v'] = [ '<C-W>v'                     , 'split right']
let g:which_key_map['h'] = [ '<C-W>s'                     , 'split below']
" let g:which_key_map['e'] = [ ':CocCommand explorer'       , 'explorer' ]
"let g:which_key_map['f'] = [ ':Telescope find_files'      , 'search files' ]
" let g:which_key_map['r'] = [ ':Ranger'                    , 'ranger' ]
" let g:which_key_map['S'] = [ ':Startify'                  , 'start screen' ]
"let g:which_key_map['T'] = [ ':Telescope live_grep'       , 'search text' ]

let g:which_key_map.c = {
      \ 'name' : '+create' ,
      \ 'n' : [':DashboardNewFile' , 'create file'],
      \ }

let g:which_key_map.f = {
      \ 'name' : '+find' ,
      \ 'c' : [':Telescope git_commits' , 'commits'],
      \ 'f' : [':Telescope find_files'  , 'find files'],
      \ 'g' : [':Telescope git_files'   , 'find git files'],
      \ 'h' : [':Telescope old_files'   , 'find file history'],
      \ 'm' : [':Telescope marks'       , 'find marks'],
      \ 't' : [':Telescope live_grep'   , 'find text'],
      \ }

      "\ 'G' : [':GFiles?'              , 'modified git files'],
      "\ '/' : [':History/'             , 'history'],
      "\ ';' : [':Commands'             , 'commands'],
      "\ 'a' : [':Ag'                   , 'text Ag'],
      "\ 'b' : [':BLines'               , 'current buffer'],
      "\ 'B' : [':Buffers'              , 'open buffers'],
      "\ 'C' : [':BCommits'             , 'buffer commits'],
      "\ 'H' : [':History:'             , 'command history'],
      "\ 'l' : [':Lines'                , 'lines'] ,
      "\ 'M' : [':Maps'                 , 'normal maps'] ,
      "\ 'p' : [':Helptags'             , 'help tags'] ,
      "\ 'P' : [':Tags'                 , 'project tags'],
      "\ 's' : [':Snippets'             , 'snippets'],
     "\ 't' : [':Rg'                   , 'text Rg'],
      "\ 'T' : [':BTags'                , 'buffer tags'],
      "\ 'w' : [':Windows'              , 'search windows'],
      "\ 'y' : [':Filetypes'            , 'file types'],
      "\ 'z' : [':FZF'                  , 'FZF'],

let g:which_key_map.s = {
      \ 'name' : '+session' ,
      \ 's' : ['<C-u>SessionSave' , 'save session'],
      \ 'l' : ['<C-u>SessionLoad' , 'load session'],
      \ }

let g:which_key_map.w = {
      \ 'name' : '+window' ,
      \ 'c' : [':Telescope colorscheme' , 'colorschemes'],
      \ }


" Register which key map
call which_key#register('<Space>', "g:which_key_map")
