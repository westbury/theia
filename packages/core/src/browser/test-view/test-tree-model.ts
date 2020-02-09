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
import { TreeModelImpl, TreeNode, CompositeTreeNode, SelectableTreeNode } from '../tree';
import { TreeDecoration, DecoratedTreeNode } from '../tree/tree-decorator';
import { TestTree } from './test-tree';
import { TxrPatternNode } from './test-tree';

export interface TestFileList {
    txrFileUri: string,
    testFileUris: string[],
}

export interface TxrTestFileNode extends TreeNode, SelectableTreeNode, DecoratedTreeNode {
    readonly txrFileUri: string;
    readonly textFileUri: string;
    readonly isMatchExpected?: boolean;
    readonly isMatchObtained?: boolean;
}

export namespace TxrTestFileNode {
    export function is(node: TreeNode): node is TxrTestFileNode {
        return 'txrFileUri' in node && 'textFileUri' in node;
    }
}

export type TxrNode = (TxrPatternNode | TxrTestFileNode);

@injectable()
export class TestTreeModel extends TreeModelImpl {

    constructor(
        @inject(TestTree) protected readonly tree: TestTree,
    ) {
        super();
    };

    getTree(): TestTree {
        return this.tree;
    }

    @postConstruct()
    async initializeTxrTestsModel(): Promise<void> {
        const testFileLists: TxrPatternNode[] = [];
        for (const config of ['A', 'B']) {
            // let decorationData: TreeDecoration.Data = {
            //     tailDecorations: [
            //         {
            //             iconClass: ['fa', 'fa-check'],
            //             color: 'green',
            //             tooltip: 'text matches: ' //  + result,
            //         }
            //     ]
            // };

            const testFileList: TxrPatternNode = {
                id: config,
                name: config,
                children: [],
                parent: undefined,
                txrFileUri: config,
                expanded: false,
                selected: false,
                decorationData: {},
            };
            testFileList.children = this.buildTestFileNodes(testFileList, config);
            testFileLists.push(testFileList);
        }

        const root: CompositeTreeNode = {
            id: 'txr-file-lists-id',
            name: 'TXR Files',
            children: testFileLists,
            parent: undefined
        };

        this.tree.root = root;
    }

    public buildTestFileNodes(parent: TxrPatternNode, config: string): TreeNode[] {
        const decorationData: TreeDecoration.Data = {
            tailDecorations: [
                {
                    iconClass: ['fa', 'fa-times'],
                    color: 'red',
                    tooltip: 'text fails to match'
                }
            ]
        };

        const testFileNodes: TxrTestFileNode[] = ['X', 'Y'].map(testFileUri => ({
            id: parent.id + ':' + testFileUri,
            name: config + testFileUri,
            parent,
            txrFileUri: parent.txrFileUri,
            textFileUri: testFileUri.toString(),
            selected: false,
            decorationData,
        }));

        return testFileNodes;
    }

    protected doOpenNode(node: TreeNode): void {
        // do nothing (in particular do not expand the node)
    }
}
