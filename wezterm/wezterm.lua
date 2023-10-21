local wezterm = require("wezterm")
local config = {
	color_scheme = "nord",
	enable_tab_bar = false,
	font_size = 16.0,
	font = wezterm.font_with_fallback({
		"JetBrains Mono",
		{ family = "Symbols Nerd Font Mono", scale = 0.75 },
	}),
}

return config
