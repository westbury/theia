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
import * as fileIcons from 'file-icons-js';
import URI from '../common/uri';
import { ContributionProvider } from '../common/contribution-provider';
import { LabelProvider, LabelProviderContribution } from './label-provider';
import { MaybePromise } from '../common/types';

export const FOLDER_ICON = 'fa fa-folder';
export const FILE_ICON = 'fa fa-file';

export const UriLabelProviderContribution = Symbol('UriLabelProviderContribution');

@injectable()
export class DefaultUriLabelProviderContribution implements LabelProviderContribution<URI> {

    canHandle(uri: URI): number {
        if (uri instanceof URI) {
            return 1;
        }
        return 0;
    }

    getIcon(uri: URI): MaybePromise<string> {
        const iconClass = this.getFileIcon(uri);
        if (!iconClass) {
            if (uri.displayName.indexOf('.') === -1) {
                return FOLDER_ICON;
            } else {
                return FILE_ICON;
            }
        }
        return iconClass;
    }

    private getFileIcon(uri: URI): string | undefined {
        return fileIcons.getClassWithColor(uri.displayName);
    }

    getName(uri: URI): string {
        return uri.displayName;
    }

    getLongName(uri: URI): string {
        return uri.path.toString();
    }
}

@injectable()
export class UriLabelProvider extends LabelProvider<URI> {

    constructor(
        @inject(ContributionProvider) @named(UriLabelProviderContribution)
        protected readonly contributionProvider: ContributionProvider<LabelProviderContribution<URI>>
    ) {
        super(contributionProvider);
    }

}
