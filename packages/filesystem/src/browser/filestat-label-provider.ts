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

import { inject, injectable, named } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { FileSystem, FileStat } from '../common';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { LabelProvider, LabelProviderContribution } from '@theia/core/lib/browser/label-provider';
import { UriLabelProvider } from '@theia/core/lib/browser/uri-label-provider';

export const FileStatLabelProviderContribution = Symbol('FileStatLabelProviderContribution');

@injectable()
export class DefaultFileStatLabelProviderContribution implements LabelProviderContribution<URI | FileStat> {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(UriLabelProvider)
    protected readonly uriLabelProvider: UriLabelProvider;

    canHandle(element: URI | FileStat): number {
        if ((element instanceof URI && element.scheme === 'file' || FileStat.is(element))) {
            return 1;
        }
        return 0;
    }

    private getUri(element: URI | FileStat): URI {
        if (FileStat.is(element)) {
            return new URI(element.uri);
        }
        return new URI(element.toString());
    }

    async getIcon(element: URI | FileStat): Promise<string> {
        const uri = this.getUri(element);
        return this.uriLabelProvider.getIcon(uri);
    }

    getName(element: URI | FileStat): string {
        const uri = this.getUri(element);
        return this.uriLabelProvider.getName(uri);
    }

    getLongName(element: URI | FileStat): string {
        const uri = this.getUri(element);
        return this.uriLabelProvider.getLongName(uri);
    }
}

@injectable()
export class FileStatLabelProvider extends LabelProvider<URI | FileStat> {

    constructor(
        @inject(ContributionProvider) @named(FileStatLabelProviderContribution)
        protected readonly contributionProvider: ContributionProvider<LabelProviderContribution<URI | FileStat>>
    ) {
        super(contributionProvider);
    }

}
