local map = vim.api.nvim_set_keymap
local opts = { noremap = true, silent = true }

map('t', '<Esc>', '<C-\\><C-n>', opts)
map('n', '<C-n>', ':call OpenTerminal()<CR>', opts)
