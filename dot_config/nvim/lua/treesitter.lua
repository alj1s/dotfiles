require'nvim-treesitter.configs'.setup {
  ensure_installed = {"python", "bash", "javascript", "clojure", "go"},
  highlight = {
    enabled = true,
    disable = {"yaml", "typescript" }
  },
  incremental_selection = {
    enabled = true,
    disable = { "cpp", "lua" }
  },
  textobjects = {
    select = {
      enable = true
    }
  }
}
