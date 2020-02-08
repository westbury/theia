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

import { injectable } from 'inversify';
import { TreeImpl, TreeNode, CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode } from '@theia/core/lib/browser/tree';
import { DecoratedTreeNode } from '@theia/core/lib/browser/tree/tree-decorator';

export interface TxrPatternNode extends CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode, DecoratedTreeNode {
    txrFileUri: string;
}

export namespace TxrPatternNode {
    export function is(node: TreeNode): node is TxrPatternNode {
        return 'txrFileUri' in node;
    }
}

@injectable()
export class TestTree extends TreeImpl {

    async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
        if (parent.children.length > 0) {
            return Promise.resolve([...parent.children]);
        }
        if (TxrPatternNode.is(parent)) {
            // Actually this is always resolved, so nothing to do here...
        }
        return Promise.resolve([]);
    }

}
