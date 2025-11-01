#!/bin/bash

SESSION_NAME="x"

# Check if the session already exists
tmux has-session -t $SESSION_NAME 2>/dev/null

# $? is a special variable that holds the exit status of the last command.
# 0 means success (session found), 1 means failure (session not found).
if [ $? != 0 ]; then
    echo "Creating new tmux session: $SESSION_NAME"

    # Create a new detached session named 'x' with the first window named 'docker'
    tmux new-session -d -s $SESSION_NAME -n docker

    # Add a new window named 'rails c' and run the command 'rails c' in it
    # We send the keys "rails c" followed by "Enter"
    tmux new-window -t $SESSION_NAME -n "rails c"
    tmux send-keys -t $SESSION_NAME:"rails c" "rails c" C-m

    # Add a new window named 'yota'
    tmux new-window -t $SESSION_NAME -n yota

    # Select the first window ('docker') to be active
    tmux select-window -t $SESSION_NAME:docker
else
    echo "Attaching to existing session: $SESSION_NAME"
fi

# Attach to the session
tmux attach-session -t $SESSION_NAME


```bash
./start_session.sh
```