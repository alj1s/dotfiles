#!/usr/bin/env sh

sketchybar --add item battery right                                        \
           --set battery updates=on                                        \
                         icon.background.drawing=on                        \
                         icon.background.color=$BLUE                       \
                         icon.background.height=8                          \
                         icon.background.corner_radius=3                   \
                         icon.padding_right=0                              \
                         icon.width=0                                      \
                         icon.align=right                                  \
                         label.drawing=off                                 \
                         background.drawing=on                             \
                         background.color=$BACKGROUND_2                    \
                         background.height=8                               \
                         background.corner_radius=3                        \
                         background.padding_left=0                         \
                         background.padding_right=-15                      \
                         align=left


sketchybar --add alias "Control Centre,Battery" right                      \
           --rename "Control Centre,Battery" battery_alias                 \
           --set battery_alias icon.drawing=off                            \
                               label.drawing=off                           \
                               alias.color=$WHITE                          \
                               background.padding_left=5                   \
                               background.padding_right=0                  \
                               align=right
