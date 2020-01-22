/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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

import { inject, injectable, interfaces } from 'inversify';
import { ScmFactoryForPlugin } from '@theia/scm/lib/browser/scm-provider';
import { ScmAmendSupport, ScmFactory } from '@theia/scm/lib/browser/scm-provider';
import { GitScmProvider, GitScmProviderOptions } from './git-scm-provider';

@injectable()
export class GitFactoryForPlugin implements ScmFactoryForPlugin {

    public pluginId = 'git';

    @inject(GitScmProvider.ScmTypeContainer) protected readonly typeContainer: interfaces.Container;

    public get<T>(id: interfaces.ServiceIdentifier<T>, rootUri: string): T | undefined {

        const container = this.typeContainer.createChild();
        const options: GitScmProviderOptions = {
            repository: { localUri: rootUri }
        };
        container.bind(GitScmProviderOptions).toConstantValue(options);
        const scmFactory: ScmFactory = {
            get<T2>(id2: interfaces.ServiceIdentifier<T2>): T2 | undefined {
                return container.get(id2);
            }
        };
        container.bind(ScmFactory).toConstantValue(scmFactory);
        container.bind(GitScmProvider).toSelf().inSingletonScope();
        const provider = container.get(GitScmProvider);

        if (id === ScmAmendSupport) {
            return provider.amendSupport as unknown as T;
        } else {
            return provider.get(id);
        }
    }

}
