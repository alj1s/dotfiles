require('nvim-treesitter.configs').setup {
  ensure_installed = {
    "bash",
    "clojure",
    "go",
    "javascript",
    "lua",
    "python",
    "rust",
    "typescript",
  },
  ignore_install = { '' },
  highlight = {
    enabled = true,
    disable = {"yaml" },
  },
  incremental_selection = {
    enabled = true,
    disable = { "cpp", "lua" },
  },
  textobjects = {
    select = {
      enable = true,
    }
  }
}
