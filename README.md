# Obsidian Things3 Sync
A Plugin for syncing between Obsidian and Things3. Supporting with Multi Language, Tags and Date, Cross-Platform. 
## Features

* Support Mac OS and iOS.
* Support **Multiple Language** when creating todo.
* Support **Todo Tags**. You can just add tags after todo, or add default tags in setting.
* Support **Capture Date**, if you the file has a Date in it, it will capture the date when create the todo.

## Fork Features

* Uses shortcuts to update multiple tasks at once
* Uses shortcuts to update the status *from* things to Obsidian (i.e., tasks marked "complete" in Things will be marked complete in Obsidian)
* Support **Project Metadata**, if your file has a value in the "project" YAML key, the things task will be created in that Things project.
* ***Notes***: Text entered as indented bullet list items will be sent as "notes". E.g.,

- [ ] task item one
    - notes item
    - additional notes

Fork requires Things 3.17 Beta and these specific shortcuts:

* [Things Bulk Update](https://www.icloud.com/shortcuts/55142b7d0e5e4c3895bf4a65020427b3)
* [Things Toggle Single](https://www.icloud.com/shortcuts/9839db1ce49f4d7ebea93fd5e4e85248)

## Usage

### Create Todo
![create](./misc/create.png)

* Select the line of todo

* Using `cmd + p` and run the `Things3 Sync: Create Todo`

* ***Tags***: for now, the tags only support existing Things tags. So add tag in Things3 first, and then use this plugin.

### Bulk Create Things Todo

* Using `cmd + P` and run the `Things3 Sync: Bulk Create Things Todo`

* If tasks are under the header `# Now`, this command will check to see if they are already in Things. If not, it will create a new task in Things.

### Mark Things Todo Complete

* Select the line of todo

* Using `cmd + P` and run the `Things3 Sync: Mark Things Todo Complete`

* Todo will be marked complete in Obsidian and in Things

### Toggle Single Things Todo

* Select the line of todo

* Using `cmd + P` and run the `Things3 Sync: Toggle Single Things Todo`

* If the todo is marked "complete" in either Things or Obsidian, it will be marked complete everywhere.

***Notes:*** If you wanna use the command conveniently, it would be better to set up a hotkeys for it.

### Toggle all Tasks in # Now Header

* Using `cmd + P` and run the `Things3 Sync: Update all Things in # Now Header`

* If tasks are under the header `# Now`, they will be updated so that if the task is marked "complete" anywhere, it will be marked complete everywhere.



## Security

This plugin require your Things 3 Auth Token for sync Todo status. The token will be locally saved in your vault obsidian folder(./obsidian/plugins). So be carefully not to share the folder directly to anyone else, incase they got your token.

## Feedback & Request

Any feedback or request, please submit a issue here ;)
Thanks a lot.

## Attribution
These following repos offered great help during development:
* [Todoist Text](https://github.com/wesmoncrief/obsidian-todoist-text)
* [Things Link](https://github.com/gavinmn/obsidian-things-link)

## Buy me a coffee

<a href="https://www.buymeacoffee.com/royx" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
