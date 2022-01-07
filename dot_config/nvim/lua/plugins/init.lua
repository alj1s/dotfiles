local install_path = vim.fn.stdpath "data" .. "/site/pack/packer/start/packer.nvim"
if vim.fn.empty(vim.fn.glob(install_path)) > 0 then
  PACKER_BOOTSTRAP = vim.fn.system {
    "git",
    "clone",
    "--depth",
    "1",
    "https://github.com/wbthomason/packer.nvim",
    install_path,
  }
  print "Installing packer close and reopen Neovim..."
  vim.cmd [[packadd packer.nvim]]
end

local packer = require('packer')

-- Autocommand that reloads neovim whenever you save this file
vim.cmd [[
  augroup packer_user_config
    autocmd!
    autocmd BufWritePost ~/.config/nvim/lua/plugins/init.lua source <afile> | PackerSync
  augroup end
]]

packer.init {
  display = {
    open_fn = function()
      return require('packer.util').float { border = 'rounded' }
    end,
  }
}

return packer.startup(function ()
  use 'wbthomason/packer.nvim'
  use 'EdenEast/nightfox.nvim'
  use 'kyazdani42/nvim-web-devicons'
  use 'kyazdani42/nvim-tree.lua'
  use "numToStr/Comment.nvim" 

  use 'neovim/nvim-lspconfig'
  use 'williamboman/nvim-lsp-installer'
  use 'jose-elias-alvarez/null-ls.nvim'
  use 'hrsh7th/nvim-cmp'
  use 'hrsh7th/cmp-nvim-lsp'
  use 'saadparwaiz1/cmp_luasnip'
  use 'L3MON4D3/Luasnip'
  use 'rafamadriz/friendly-snippets'
  --use 'glepnir/lspsaga.nvim'
  use 'onsails/lspkind-nvim'
  use { 'nvim-treesitter/nvim-treesitter', run = ':TSUpdate' }
  --use 'nvim-treesitter/nvim-treesitter-textobjects'
  --use 'folke/trouble.nvim'

  -- telescope requirements
  use { 'nvim-telescope/telescope.nvim', requires = { { 'nvim-lua/plenary.nvim' } } }

  use 'lewis6991/gitsigns.nvim'
  use 'TimUntersberger/neogit'
  use 'sindrets/diffview.nvim'

  use 'nvim-lualine/lualine.nvim'
  use 'rcarriga/nvim-notify'

  use 'goolord/alpha-nvim'
  use 'folke/which-key.nvim'
  use 'akinsho/toggleterm.nvim'

  --use 'christoomey/vim-tmux-navigator'
end)

