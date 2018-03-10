map q <Nop>

nmap <silent> <leader>ev :e $MYVIMRC<CR>
nmap <silent> <leader>sv :so $MYVIMRC<CR>
nmap <silent> <esc> :noh<CR>

nnoremap n nzzzv
nnoremap N Nzzzv

vnoremap < <gv
vnoremap > >gv


cmap w!! !sudo tee % > /dev/null
