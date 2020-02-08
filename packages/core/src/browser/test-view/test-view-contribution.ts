/********************************************************************************
 * Copyright (C) 2019 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { inject, injectable, postConstruct } from 'inversify';
import {
    AbstractViewContribution,
    FrontendApplicationContribution, LabelProvider,
    KeybindingRegistry,
    ViewContainerTitleOptions
} from '..';
import { CommandRegistry, CommandService } from '../../common';
import { ContextKeyService, ContextKey } from '../context-key-service';
import { TestWidget } from './test-widget';
import { ColorContribution } from '../color-application-contribution';
import { ColorRegistry, Color } from '../color-registry';

export const TEST_WIDGET_FACTORY_ID = TestWidget.ID;
export const TEST_VIEW_CONTAINER_ID = 'test-view-container';
export const TEST_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: 'Test',
    iconClass: 'theia-plugin-test-tab-icon',
    closeable: true
};

// export namespace SCM_COMMANDS {
//     export const CHANGE_REPOSITORY = {
//         id: 'scm.change.repository',
//         category: 'SCM',
//         label: 'Change Repository...'
//     };
//     export const ACCEPT_INPUT = {
//         id: 'scm.acceptInput'
//     };
// }

@injectable()
export class TestContribution extends AbstractViewContribution<TestWidget> implements FrontendApplicationContribution, ColorContribution {

    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    @inject(CommandService) protected readonly commands: CommandService;
    @inject(ContextKeyService) protected readonly contextKeys: ContextKeyService;

    protected scmFocus: ContextKey<boolean>;

    constructor() {
        super({
            viewContainerId: TEST_VIEW_CONTAINER_ID,
            widgetId: TEST_WIDGET_FACTORY_ID,
            widgetName: 'Source Control',
            defaultWidgetOptions: {
                area: 'left',
                rank: 300
            },
            toggleCommandId: 'scmView:toggle',
            toggleKeybinding: 'ctrlcmd+shift+g'
        });
    }

    @postConstruct()
    protected init(): void {
        this.scmFocus = this.contextKeys.createKey('scmFocus', false);
    }

    async initializeLayout(): Promise<void> {
        await this.openView();
    }

    onStart(): void {
        this.updateContextKeys();
        this.shell.currentChanged.connect(() => this.updateContextKeys());
    }

    protected updateContextKeys(): void {
        this.scmFocus.set(this.shell.currentWidget instanceof TestWidget);
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        super.registerCommands(commandRegistry);
        // commandRegistry.registerCommand(SCM_COMMANDS.ACCEPT_INPUT, {
        //     execute: () => this.acceptInput(),
        //     isEnabled: () => !!this.scmFocus.get() && !!this.acceptInputCommand()
        // });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        super.registerKeybindings(keybindings);
        // keybindings.registerKeybinding({
        //     command: SCM_COMMANDS.ACCEPT_INPUT.id,
        //     keybinding: 'ctrlcmd+enter',
        //     when: 'scmFocus'
        // });
    }

    /**
     * It should be aligned with https://github.com/microsoft/vscode/blob/0dfa355b3ad185a6289ba28a99c141ab9e72d2be/src/vs/workbench/contrib/scm/browser/dirtydiffDecorator.ts#L808
     */
    registerColors(colors: ColorRegistry): void {
        const overviewRulerDefault = Color.rgba(0, 122, 204, 0.6);
        colors.register(
            {
                id: 'editorGutter.modifiedBackground', defaults: {
                    dark: Color.rgba(12, 125, 157),
                    light: Color.rgba(102, 175, 224),
                    hc: Color.rgba(0, 155, 249)
                }, description: 'Editor gutter background color for lines that are modified.'
            },
            {
                id: 'editorGutter.addedBackground', defaults: {
                    dark: Color.rgba(88, 124, 12),
                    light: Color.rgba(129, 184, 139),
                    hc: Color.rgba(51, 171, 78)
                }, description: 'Editor gutter background color for lines that are added.'
            },
            {
                id: 'editorGutter.deletedBackground', defaults: {
                    dark: Color.rgba(148, 21, 27),
                    light: Color.rgba(202, 75, 81),
                    hc: Color.rgba(252, 93, 109)
                }, description: 'Editor gutter background color for lines that are deleted.'
            },
            {
                id: 'minimapGutter.modifiedBackground', defaults: {
                    dark: Color.rgba(12, 125, 157),
                    light: Color.rgba(102, 175, 224),
                    hc: Color.rgba(0, 155, 249)
                }, description: 'Minimap gutter background color for lines that are modified.'
            },
            {
                id: 'minimapGutter.addedBackground',
                defaults: {
                    dark: Color.rgba(88, 124, 12),
                    light: Color.rgba(129, 184, 139),
                    hc: Color.rgba(51, 171, 78)
                }, description: 'Minimap gutter background color for lines that are added.'
            },
            {
                id: 'minimapGutter.deletedBackground', defaults: {
                    dark: Color.rgba(148, 21, 27),
                    light: Color.rgba(202, 75, 81),
                    hc: Color.rgba(252, 93, 109)
                }, description: 'Minimap gutter background color for lines that are deleted.'
            },
            {
                id: 'editorOverviewRuler.modifiedForeground', defaults: {
                    dark: overviewRulerDefault, light: overviewRulerDefault, hc: overviewRulerDefault
                }, description: 'Overview ruler marker color for modified content.'
            },
            {
                id: 'editorOverviewRuler.addedForeground', defaults: {
                    dark: overviewRulerDefault, light: overviewRulerDefault, hc: overviewRulerDefault
                }, description: 'Overview ruler marker color for added content.'
            },
            {
                id: 'editorOverviewRuler.deletedForeground', defaults: {
                    dark: overviewRulerDefault, light: overviewRulerDefault, hc: overviewRulerDefault
                }, description: 'Overview ruler marker color for deleted content.'
            }
        );
    }

}
