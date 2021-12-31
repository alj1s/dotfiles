local map = vim.api.nvim_set_keymap
local opts = { noremap = true, silent = true }

map('t', '<Esc>', '<C-\\><C-n>', opts)
map('n', '<C-n>', ':call OpenTerminal()<CR>', opts)

vim.cmd [[
  augroup terminal_config
    autocmd!
    autocmd BufEnter * if &buftype == 'terminal' | : startinsert | endif

    function! OpenTerminal()
      split term://zsh
      resize 10
    endfunction
  augroup end
]]
