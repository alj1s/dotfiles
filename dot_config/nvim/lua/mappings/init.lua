local map = vim.api.nvim_set_keymap
local opts = { noremap = true, silent = true }

vim.g.mapleader = ' '

map('n', '<leader>e', ':NvimTreeToggle<CR>', opts)

map('n', '<C-h>', '<C-w>h', opts)
map('n', '<C-j>', '<C-w>j', opts)
map('n', '<C-k>', '<C-w>k', opts)
map('n', '<C-l>', '<C-w>l', opts)

-- map('n', '<C-Up>', ':resize +2<CR>', opts)
-- map('n', '<C-Down>', ':resize -2<CR>', opts)
-- map('n', '<C-Left>', ':vertical resize -2<CR>', opts)
-- map('n', '<C-Right>', ':vertical resize +2<CR>', opts)

map('v', 'J', ":m '>+1<CR>gv=gv", opts)
map('v', 'K', ":m '<-2<CR>gv=gv", opts)

map('n', 'gd', '<cmd>lua vim.lsp.buf.definition()<CR>', opts)
map('n', 'gD', '<cmd>lua vim.lsp.buf.declaration()<CR>', opts)
map('n', 'gr', '<cmd>lua vim.lsp.buf.references()<CR>', opts)
map('n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<CR>', opts)
--map('n', '<C-k>', '<cmd>lua vim.lsp.buf.signature_help()<CR>', opts)
map('n', 'gf', '<cmd>lua vim.lsp.buf.formatting()<CR>', opts)
map('n', 'gn', '<cmd>lua vim.lsp.buf.rename()<CR>', opts)

--map('n', 'K',     '<cmd>Lspsaga hover_doc<CR>', opts)
--map('n', '<C-p>', '<cmd>Lspsaga diagnostic_jump_prev<CR>', opts)
--map('n', '<C-n>', '<cmd>Lspsaga diagnostic_jump_next<CR>', opts)
--map('n', 'ga',    '<cmd>Lspsaga code_action<CR>', opts)
--map('x', 'ga',    '<cmd>Lspsaga range_code_action<CR>', opts)
--map('n', 'gs',    '<cmd>Lspsaga signature_help<CR>', opts)
