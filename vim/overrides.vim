"Visual Mode Orange Background, Black Text
hi Visual          guifg=#000000 guibg=#FD971F

" Default Colors for CursorLine
highlight CursorLine guibg=#3E3D32
highlight Cursor guibg=#A6E22E

" Change Color when entering Insert Mode
autocmd InsertEnter * highlight  CursorLine guibg=#323D3E
autocmd InsertEnter * highlight  Cursor guibg=#00AAFF

" Revert Color to default when leaving Insert Mode
autocmd InsertLeave * highlight  CursorLine guibg=#3E3D32
autocmd InsertLeave * highlight  Cursor guibg=#A6E22E

highlight Comment cterm=italic

au BufRead,BufNewFile *.es6   setfiletype javascript

autocmd FileType javascript set formatprg=prettier\ --no-semi\ --stdin

autocmd BufWritePre *.js exe "normal! gggqG\<C-o>\<C-o>"
