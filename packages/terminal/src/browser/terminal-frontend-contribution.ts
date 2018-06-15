/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from "inversify";
import {
    CommandContribution,
    Command,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    isOSX
} from '@theia/core/lib/common';
import {
    CommonMenus, ApplicationShell, KeybindingContribution, KeyCode, Key,
    KeyModifier, KeybindingRegistry
} from '@theia/core/lib/browser';
import { WidgetManager } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { TERMINAL_WIDGET_FACTORY_ID, TerminalWidgetFactoryOptions, TerminalWidgetImpl } from './terminal-widget';
import { TerminalKeybindingContexts } from "./terminal-keybinding-contexts";
import { TerminalService } from './base/terminal-service';
import { TerminalWidgetOptions, TerminalWidget } from './base/terminal-widget';

export namespace TerminalCommands {
    export const NEW: Command = {
        id: 'terminal:new',
        label: 'Open New Terminal'
    };

    export const NEW_TERM_WITH_ENV: Command = {
        id: 'terminal:new:with:env',
        label: 'New Terminal with env'
    };

    export const NEW_TERM_OPEN_WITH_DELAY: Command = {
        id: 'terminal:open:new:terminal:with:delay',
        label: 'Open new terminal with delay 5 second'
    };

    export const NEW_TERM_OPEN_WITH_CWD: Command = {
        id: 'terminal:open:new:terminal:with:cwd',
        label: 'Open new terminal with CWD'
    };

    export const NEW_TERM_OPEN_WITH_SHELL_PATH: Command = {
        id: 'terminal:open:new:terminal:with:shell:path',
        label: 'Open new terminal with shell path'
    };

    export const NEW_TERM_OPEN_WITH_REACTION_ON_CLOSE_EVENT: Command = {
        id: 'terminal:open:new:terminal:with:reaction:on:close:event',
        label: 'Open new terminal with reaction on close event'
    };

    export const NEW_TERM_OPEN_WITH_TEXT: Command = {
        id: 'terminal:open:new:terminal:with:text',
        label: 'Open new terminal and send text'
    };

    export const NEW_TERM_WITH_NULL_VALUE_ENV: Command = {
        id: 'terminal:new:with:null:value:env',
        label: 'New Terminal with null value env'
    };
}

@injectable()
export class TerminalFrontendContribution implements TerminalService, CommandContribution, MenuContribution, KeybindingContribution {

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService
    ) { }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TerminalCommands.NEW);
        commands.registerHandler(TerminalCommands.NEW.id, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({});
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_WITH_ENV);
        commands.registerHandler(TerminalCommands.NEW_TERM_WITH_ENV.id, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({env: {"TEST": "HELLO THEIA!"}});
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_OPEN_WITH_DELAY, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({});
                termWidget.start();
                setTimeout(() => {
                    this.activateWidget(termWidget);
                }, 5000);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_OPEN_WITH_CWD, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({cwd: "/home/user/projects/che"});
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_OPEN_WITH_SHELL_PATH, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({shellPath: "sh"});
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_OPEN_WITH_REACTION_ON_CLOSE_EVENT, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({});
                termWidget.onTerminalDidClose(terminal => {
                    console.log(terminal, "was closed");
                });
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });

        // todo
        commands.registerCommand(TerminalCommands.NEW_TERM_OPEN_WITH_TEXT, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({});
                await termWidget.start();
                termWidget.sendText("Hello Theia");
                this.activateWidget(termWidget);
            }
        });

        commands.registerCommand(TerminalCommands.NEW_TERM_WITH_NULL_VALUE_ENV, {
            isEnabled: () => true,
            execute: async () => {
                const termWidget = await this.newTerminal({env: {"TEST": ""}});
                termWidget.start();
                this.activateWidget(termWidget);
            }
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.FILE_NEW, {
            commandId: TerminalCommands.NEW.id
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: TerminalCommands.NEW.id,
            keybinding: "ctrl+`"
        });

        /* Register passthrough keybindings for combinations recognized by
           xterm.js and converted to control characters.

             See: https://github.com/xtermjs/xterm.js/blob/v3/src/Terminal.ts#L1684 */

        /* Register ctrl + k (the passed Key) as a passthrough command in the
           context of the terminal.  */
        const regCtrl = (k: Key) => {
            keybindings.registerKeybinding({
                command: KeybindingRegistry.PASSTHROUGH_PSEUDO_COMMAND,
                keybinding: KeyCode.createKeyCode({ first: k, modifiers: [KeyModifier.CTRL] }).toString(),
                context: TerminalKeybindingContexts.terminalActive,
            });
        };

        /* Register alt + k (the passed Key) as a passthrough command in the
           context of the terminal.  */
        const regAlt = (k: Key) => {
            keybindings.registerKeybinding({
                command: KeybindingRegistry.PASSTHROUGH_PSEUDO_COMMAND,
                keybinding: KeyCode.createKeyCode({ first: k, modifiers: [KeyModifier.Alt] }).toString(),
                context: TerminalKeybindingContexts.terminalActive
            });
        };

        /* ctrl-space (000 - NUL).  */
        regCtrl(Key.SPACE);

        /* ctrl-A (001/1/0x1) through ctrl-Z (032/26/0x1A).  */
        for (let i = 0; i < 26; i++) {
            regCtrl({
                keyCode: Key.KEY_A.keyCode + i,
                code: 'Key' + String.fromCharCode('A'.charCodeAt(0) + i)
            });
        }

        /* ctrl-[ or ctrl-3 (033/27/0x1B - ESC).  */
        regCtrl(Key.BRACKET_LEFT);
        regCtrl(Key.DIGIT3);

        /* ctrl-\ or ctrl-4 (034/28/0x1C - FS).  */
        regCtrl(Key.BACKSLASH);
        regCtrl(Key.DIGIT4);

        /* ctrl-] or ctrl-5 (035/29/0x1D - GS).  */
        regCtrl(Key.BRACKET_RIGHT);
        regCtrl(Key.DIGIT5);

        /* ctrl-6 (036/30/0x1E - RS).  */
        regCtrl(Key.DIGIT6);

        /* ctrl-7 (037/31/0x1F - US).  */
        regCtrl(Key.DIGIT7);

        /* ctrl-8 (177/127/0x7F - DEL).  */
        regCtrl(Key.DIGIT8);

        /* alt-A (0x1B 0x62) through alt-Z (0x1B 0x7A).  */
        for (let i = 0; i < 26; i++) {
            regAlt({
                keyCode: Key.KEY_A.keyCode + i,
                code: 'Key' + String.fromCharCode('A'.charCodeAt(0) + i)
            });
        }

        /* alt-` (0x1B 0x60).  */
        regAlt(Key.BACKQUOTE);

        /* alt-0 (0x1B 0x30) through alt-9 (0x1B 0x39).  */
        for (let i = 0; i < 10; i++) {
            regAlt({
                keyCode: Key.DIGIT0.keyCode + i,
                code: 'Digit' + String.fromCharCode('0'.charCodeAt(0) + i)
            });
        }
        if (isOSX) {
            // selectAll on OSX
            keybindings.registerKeybinding({
                command: KeybindingRegistry.PASSTHROUGH_PSEUDO_COMMAND,
                keybinding: "ctrlcmd+a",
                context: TerminalKeybindingContexts.terminalActive
            });
        }
    }

    async newTerminal(options: TerminalWidgetOptions): Promise<TerminalWidget> {
        const widget = <TerminalWidgetImpl>await this.widgetManager.getOrCreateWidget(TERMINAL_WIDGET_FACTORY_ID, <TerminalWidgetFactoryOptions>{
            created: new Date().toString(),
            ...options
        });
        return widget;
    }

    activateWidget(widget: TerminalWidget): void {
        const tabBar = this.shell.getTabBarFor(widget);
        if (!tabBar) {
            this.shell.expandPanel("bottom");
            this.shell.addWidget(widget, { area: 'bottom' });
            this.shell.activateWidget(widget.id);
        }
    }
}
