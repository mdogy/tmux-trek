<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to build such a game as vim adventures for learning tmux. I want to give context for all the tmux commands. Provide the documentation website which perplexity can read, as wll as some excellend tutorials.

Here are the best documentation sources and tutorials to build your tmux-teaching game, organized by usefulness for your project.

## Official Documentation

- **[tmux GitHub Wiki](https://github.com/tmux/tmux/wiki)** — The canonical reference, maintained by the tmux authors. The [Getting Started page](https://github.com/tmux/tmux/wiki/Getting-Started) is the best single-page overview of the mental model (sessions → windows → panes).[^1]
- **[man7.org tmux manual page](https://man7.org/linux/man-pages/man1/tmux.1.html)** — The complete formal reference for every command, flag, and option. Essential for building command context descriptions.[^2]
- **[tmux.app/doc](https://tmux.app/doc/)** — A structured community documentation hub covering sessions, windows, panes, copy mode, configuration, and scripting — more readable than the man page.[^3]


## Cheat Sheets (Great for Game Level Design)

These map directly to what you'd teach in each game level:

- **[tmuxcheatsheet.com](https://tmuxcheatsheet.com)** — Clean, well-organized by category (session, window, pane commands) with examples[^4]
- **[quickref.me/tmux](https://quickref.me/tmux.html)** — Dense visual reference with all keyboard shortcuts laid out in tables, ideal for mapping to game puzzles[^5]
- **[phoenixnap.com tmux cheat sheet](https://phoenixnap.com/kb/tmux-cheat-sheet)** — Noteworthy because it includes **copy mode navigation** (`h/j/k/l`, `w`, `SPACE`, `ENTER`) — which is vim-style and perfect for your game since players learning tmux copy mode will already know VIM keys[^6]


## Tutorials (Narrative Context for Game Story/Levels)

| Tutorial | Level | Best For |
| :-- | :-- | :-- |
| [Red Hat beginner's guide](https://www.redhat.com/en/blog/introduction-tmux-linux) | Beginner | Basic pane/session mental model [^7] |
| [tmuxai.dev interactive guide](https://tmuxai.dev/tmux-getting-started/) | Beginner | Interactive explanations of core concepts [^8] |
| [Towards Data Science: tmux for terminal](https://towardsdatascience.com/a-beginners-guide-to-tmux-a-multitasking-superpower-for-your-terminal/) | Beginner–Mid | Good real-world workflow framing [^9] |
| [ArchWiki tmux](https://wiki.archlinux.org/title/Tmux) | Intermediate | Configuration, plugins, advanced usage [^10] |
| [LinkedIn: complete config guide 2025](https://www.linkedin.com/pulse/complete-tmux-configuration-guide-modern-developers-2025-sadiq-ali-9x6dc) | Advanced | `.tmux.conf` customization, modern syntax [^11] |

## Game Design Suggestion

A natural **level progression** for your tmux game would mirror the hierarchy of tmux itself:

1. **Sessions** — `new`, `attach`, `detach`, `kill-session`, `ls`
2. **Windows** — `c` (create), `n`/`p` (navigate), `,` (rename), `&` (kill), `w` (list)
3. **Panes** — `%`/`"` (split), arrow keys (navigate), `z` (zoom), `x` (kill), `{`/`}` (swap)
4. **Copy mode** — `[` (enter), vim navigation (`h/j/k/l`, `w/b`), `Space`/`Enter` (select/copy), `]` (paste)
5. **Config / Scripting** — `tmuxinator`, `.tmux.conf`, `bind-key`, `set-option`

Copy mode is especially compelling since it already uses vim keybindings — making it a natural **bridge level** for players coming from VIM Adventures.[^6]
<span style="display:none">[^12][^13][^14][^15]</span>

<div align="center">⁂</div>

[^1]: https://github.com/tmux/tmux/wiki/Getting-Started

[^2]: https://man7.org/linux/man-pages/man1/tmux.1.html

[^3]: https://tmux.app/doc/

[^4]: https://tmuxcheatsheet.com

[^5]: https://quickref.me/tmux.html

[^6]: https://phoenixnap.com/kb/tmux-cheat-sheet

[^7]: https://www.redhat.com/en/blog/introduction-tmux-linux

[^8]: https://tmuxai.dev/tmux-getting-started/

[^9]: https://towardsdatascience.com/a-beginners-guide-to-tmux-a-multitasking-superpower-for-your-terminal/

[^10]: https://wiki.archlinux.org/title/Tmux

[^11]: https://www.linkedin.com/pulse/complete-tmux-configuration-guide-modern-developers-2025-sadiq-ali-9x6dc

[^12]: https://github.com/tmux/tmux/wiki

[^13]: https://tmux.us

[^14]: https://www.pluralsight.com/resources/blog/cloud/tmux-cheat-sheet

[^15]: https://blog.shadabmohammad.com/getting-started-with-tmux-for-beginners-and-advanced-users-f712c76672f6

