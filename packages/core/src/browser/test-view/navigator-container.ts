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

import { Container, interfaces } from 'inversify';
import { createTreeContainer, Tree, TreeModel, TreeProps, defaultTreeProps, TreeImpl, TreeModelImpl, TreeWidget } from '..';
// import { bindContributionProvider } from '../../common/contribution-provider';
import { TestTree } from './test-tree';
import { TestTreeModel } from './test-tree-model';
import { TestWidget } from './test-widget';
import { TEST_CONTEXT_MENU } from './test-view-contribution';
// import { NavigatorDecoratorService, NavigatorTreeDecorator } from './navigator-decorator-service';

export const FILE_NAVIGATOR_PROPS = <TreeProps>{
    ...defaultTreeProps,
    contextMenuPath: TEST_CONTEXT_MENU,
    multiSelect: true,
    search: true,
    globalSelection: true
};

export function createFileNavigatorContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(TestTree).toSelf();
    child.rebind(Tree).toService(TestTree);

    child.unbind(TreeModelImpl);
    child.bind(TestTreeModel).toSelf();
    child.rebind(TreeModel).toService(TestTreeModel);

    child.unbind(TreeWidget);
    child.bind(TestWidget).toSelf();

    child.rebind(TreeProps).toConstantValue(FILE_NAVIGATOR_PROPS);

    // child.bind(NavigatorDecoratorService).toSelf().inSingletonScope();
    // child.rebind(TreeDecoratorService).toService(NavigatorDecoratorService);
    // bindContributionProvider(child, NavigatorTreeDecorator);

    return child;
}

export function createFileNavigatorWidget(parent: interfaces.Container): TestWidget {
    return createFileNavigatorContainer(parent).get(TestWidget);
}
