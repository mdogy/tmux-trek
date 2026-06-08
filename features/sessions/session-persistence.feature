Feature: Session persistence tutorial
  As a player learning tmux
  I want guided practice with sessions
  So that I understand how work survives detach and reattach

  Scenario: A named session persists after detach and can be reattached
    Given the tmux engine is reset
    When the player enters "tmux new -s clulix"
    And the player uses the keybinding "d"
    Then no session should be active
    When the player enters "tmux ls"
    Then the output should mention "clulix"
    When the player enters "tmux attach -t clulix"
    Then the active session should be "clulix"

  Scenario: Rescue views and scanner panes remain inside one session
    Given the tmux engine is reset
    When the player enters "tmux new -s clulix"
    And the player uses the keybinding "c"
    Then the active session should have 2 windows
    When the player uses the keybinding "%"
    And the player uses the keybinding "\""
    Then the active window should have 3 panes
    When the player uses the keybinding "x"
    Then the active window should have 2 panes
