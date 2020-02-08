/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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

import { injectable, inject, postConstruct } from 'inversify';
import { Message } from '@phosphor/messaging';
import URI from '../../common/uri';
import { CommandService, SelectionService } from '../../common';
import { CorePreferences, ViewContainerTitleOptions, Key } from '..';
import { ContextMenuRenderer, TreeWidget, TreeProps, TreeModel, TreeModelImpl, TreeNode } from '..';
// import { FileTreeWidget, FileNode } from '@theia/filesystem/lib/browser';
// import { WorkspaceService, WorkspaceCommands } from '@theia/workspace/lib/browser';
import { ApplicationShell } from '../shell/application-shell';
// import { WorkspaceNode, WorkspaceRootNode } from './navigator-tree';
// import { FileNavigatorModel } from '@theia/navigator/lib/browser//navigator-model';  // FIXME
// import { FileSystem } from '@theia/filesystem/lib/common/filesystem';
// import { isOSX, environment } from '../..';
import * as React from 'react';
// import { NavigatorContextKeyService } from './navigator-context-key-service';

export const TEST_VIEW_ID = 'files';  // replaced by ID ???
export const EXPLORER_VIEW_CONTAINER_ID = 'explorer-view-container';
export const EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: 'Explorer',
    iconClass: 'navigator-tab-icon',
    closeable: true
};

export const LABEL = 'No folder opened';
export const CLASS = 'theia-Files';

@injectable()
export class TestWidget extends TreeWidget {

    static ID = 'test-view';

    @inject(CorePreferences) protected readonly corePreferences: CorePreferences;

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TreeModelImpl) readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(CommandService) protected readonly commandService: CommandService,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
    ) {
        super(props, model, contextMenuRenderer);
        this.addClass(CLASS);
    }

    @postConstruct()
    protected init(): void {
        super.init();
        // this.updateSelectionContextKeys();
        // this.toDispose.pushAll([
        //     this.model.onSelectionChanged(() =>
        //         this.updateSelectionContextKeys()
        //     ),
        //     // this.model.onExpansionChanged(node => {
        //     //     if (node.expanded && node.children.length === 1) {
        //     //         const child = node.children[0];
        //     //         if (ExpandableTreeNode.is(child) && !child.expanded) {
        //     //             this.model.expandNode(child);
        //     //         }
        //     //     }

        //     // })
        // ]);
    }

    protected doUpdateRows(): void {
        super.doUpdateRows();
        this.title.label = LABEL;
        // if (WorkspaceNode.is(this.model.root)) {
        //     if (this.model.root.name === WorkspaceNode.name) {
        //         const rootNode = this.model.root.children[0];
        //         if (WorkspaceRootNode.is(rootNode)) {
        //             this.title.label = this.toNodeName(rootNode);
        //             this.title.caption = this.labelProvider.getLongName(rootNode.uri);
        //         }
        //     } else {
        //         this.title.label = this.toNodeName(this.model.root);
        //         this.title.caption = this.title.label;
        //     }
        // } else {
        //     this.title.caption = this.title.label;
        // }
    }

    protected enableDndOnMainPanel(): void {
        // const mainPanelNode = this.shell.mainPanel.node;
        // this.addEventListener(mainPanelNode, 'drop', async ({ dataTransfer }) => {
        //     const treeNodes = dataTransfer && this.getSelectedTreeNodesFromData(dataTransfer) || [];
        //     treeNodes.filter(FileNode.is).forEach(treeNode => this.commandService.executeCommand(CommonCommands.OPEN.id, treeNode.uri));
        // });
        // const handler = (e: DragEvent) => {
        //     if (e.dataTransfer) {
        //         e.dataTransfer.dropEffect = 'link';
        //         e.preventDefault();
        //     }
        // };
        // this.addEventListener(mainPanelNode, 'dragover', handler);
        // this.addEventListener(mainPanelNode, 'dragenter', handler);
    }

    protected getContainerTreeNode(): TreeNode | undefined {
        const root = this.model.root;
        return root;
    }

    protected deflateForStorage(node: TreeNode): object {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const copy = { ...node } as any;
        if (copy.uri) {
            copy.uri = copy.uri.toString();
        }
        return super.deflateForStorage(copy);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected inflateFromStorage(node: any, parent?: TreeNode): TreeNode {
        if (node.uri) {
            node.uri = new URI(node.uri);
        }
        return super.inflateFromStorage(node, parent);
    }

    protected renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model) || this.renderOpenWorkspaceDiv();
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
        this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
        this.enableDndOnMainPanel();
    }

    protected handleCopy(_event: ClipboardEvent): void {
        // const uris = this.model.selectedFileStatNodes.map(node => node.uri.toString());
        // if (uris.length > 0 && event.clipboardData) {
        //     event.clipboardData.setData('text/plain', uris.join('\n'));
        //     event.preventDefault();
        // }
    }

    protected handlePaste(_event: ClipboardEvent): void {
        // if (event.clipboardData) {
        //     const raw = event.clipboardData.getData('text/plain');
        //     if (!raw) {
        //         return;
        //     }
        //     for (const file of raw.split('\n')) {
        //         const uri = new URI(file);
        //         if (this.model.copy(uri)) {
        //             event.preventDefault();
        //         }
        //     }
        // }
    }

    protected readonly openFolder = () => this.doOpenFolder();
    protected doOpenFolder(): void {
        // A command example
    }

    protected readonly keyUpHandler = (e: React.KeyboardEvent) => {
        if (Key.ENTER.keyCode === e.keyCode) {
            (e.target as HTMLElement).click();
        }
    };
    /**
     * Instead of rendering the file resources from the workspace, we render a placeholder
     * button when the workspace root is not yet set.
     */
    protected renderOpenWorkspaceDiv(): React.ReactNode {
        // let openButton;

        // if (this.canOpenWorkspaceFileAndFolder) {
        //     openButton = <button className='theia-button open-workspace-button' title='Select a folder or a workspace-file to open as your workspace'
        //         onClick={this.openWorkspace} onKeyUp={this.keyUpHandler}>
        //         Open Workspace
        //     </button>;
        // } else {
        const openButton = <button className='theia-button open-workspace-button' title='Select a folder as your workspace root' onClick={this.openFolder}
            onKeyUp={this.keyUpHandler}>
            Open Folder
            </button>;
        // }

        return <div className='theia-navigator-container'>
            <div className='center'>You have not yet opened a workspace.</div>
            <div className='open-workspace-button-container'>
                {openButton}
            </div>
        </div>;
    }

    // protected onAfterShow(msg: Message): void {
    //     super.onAfterShow(msg);
    //     this.contextKeyService.explorerViewletVisible.set(true);
    // }

    // protected onAfterHide(msg: Message): void {
    //     super.onAfterHide(msg);
    //     this.contextKeyService.explorerViewletVisible.set(false);
    // }

    // protected updateSelectionContextKeys(): void {
    //     this.contextKeyService.explorerResourceIsFolder.set(DirNode.is(this.model.selectedNodes[0]));
    // }

}

@injectable()
export class TestTreeModel extends TreeModelImpl {

}
