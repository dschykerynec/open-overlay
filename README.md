# open-overlay

A simple, open-source overlay for iRacing. Currently has a telemetry overlay with brake, throttle, and clutch traces, steering wheel angle, gear selection, and speed.

Built with [Electron.js](https://www.electronjs.org/) and [Vue.js](https://vuejs.org/). [iracing-sdk-js](https://github.com/Friss/iracing-sdk-js) is used to interface with the iRacing SDK.

![image](https://github.com/user-attachments/assets/ae2b3fee-a171-4cc5-bac8-265ec48eba9e)

## Why does this exist?

I love sim racing and sometimes my friends watch me stream my races in Discord. I thought it would be neat to have a detailed telemetry overlay for them to see while I race, but the popular solutions on the market charge a monthly fee that is close to the subscription cost of iRacing. Other open-source solutiosn exist, such as [iRon](https://github.com/lespalt/iRon), but they haven't been updated in some time, and I thought it would be a fun learning opportunity to build this kind of thing from scratch myself.

I will update this repo sporadically as I learn more about how to maintain an open-source project and add new features and overlays. There will not be a regular release cadence as this is primarily for my own personal use and learning.

## Project Setup
Assuming you are familiar with node projects, follow the below guide after cloning this repo.

### Install

```
$ npm install
```

### Development

```
$ npm run dev
```

### Build
While you can build an executable using the commands below, it is recommended to follow the [packaging guide](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging) and [publishing guide](https://www.electronjs.org/docs/latest/tutorial/tutorial-publishing-updating) on the Electron website. For end users, I will be updating this project using [Electron Forge](https://www.electronforge.io/), the recommended method of updating Electron apps.

```
# For windows
$ npm run build:win
```

## Roadmap
While this is mainly a fun side-project for learning, I do plan to update it (in a probably irregular fashion). Below are my current priorities roughly in order from top to bottom.

- main menu window to configure user preferences
- draggable windows with configurable default positions
- relative window
- standings window

## Attributions
F1 Steering wheel icon: <a href="https://www.flaticon.com/free-icons/f1" title="f1 icons">F1 icons created by Freepik - Flaticon</a>
