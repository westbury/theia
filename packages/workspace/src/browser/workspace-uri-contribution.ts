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

import { LabelProviderContribution } from '@theia/core/lib/browser/label-provider';
import { FOLDER_ICON, FILE_ICON } from '@theia/core/lib/browser/uri-label-provider';
import URI from '@theia/core/lib/common/uri';
import { injectable, inject, postConstruct } from 'inversify';
import { FileSystem, FileStat } from '@theia/filesystem/lib/common';
import { MaybePromise } from '@theia/core';
import { WorkspaceVariableContribution } from './workspace-variable-contribution';
import { UriLabelProvider } from '@theia/core/lib/browser/uri-label-provider';
// import * as fileIcons from 'file-icons-js';

@injectable()
export class WorkspaceUriLabelProviderContribution implements LabelProviderContribution<URI | FileStat> {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WorkspaceVariableContribution)
    protected readonly workspaceVariable: WorkspaceVariableContribution;

    @inject(UriLabelProvider)
    protected readonly uriLabelProvider: UriLabelProvider;

    @postConstruct()
    protected async init(): Promise<void> {
        // no-op, backward compatibility
    }

    canHandle(element: URI | FileStat): number {
        if ((element instanceof URI && element.scheme === 'file' || FileStat.is(element))) {
            return 10;
        }
        return 0;
    }

    private getUri(element: URI | FileStat): URI {
        if (FileStat.is(element)) {
            return new URI(element.uri);
        }
        return new URI(element.toString());
    }

    private getStat(element: URI | FileStat): MaybePromise<FileStat | undefined> {
        if (FileStat.is(element)) {
            return element;
        }
        return this.fileSystem.getFileStat(element.toString());
    }

    async getIcon(element: URI | FileStat): Promise<string> {
        if (FileStat.is(element) && element.isDirectory) {
            return FOLDER_ICON;
        }
        const uri = this.getUri(element);
        const icon = this.getFileIcon(uri);
        if (!icon) {
            try {
                const stat = await this.getStat(element);
                return stat && stat.isDirectory ? FOLDER_ICON : FILE_ICON;
            } catch (err) {
                return FILE_ICON;
            }
        }
        return icon;
    }

    private getFileIcon(uri: URI): string | undefined {
        // TODO
        // return fileIcons.getClassWithColor(uri.displayName);
        return undefined;
    }

    getName(element: URI | FileStat): string {
        // TODO pass this on the next lower priority
        const uri = this.getUri(element);
        return this.uriLabelProvider.getName(uri);
    }

    /**
     * trims the workspace root from a file uri, if it is a child.
     */
    getLongName(element: URI | FileStat): string {
        const uri = this.getUri(element);
        const relativePath = this.workspaceVariable.getWorkspaceRelativePath(uri);
        // TODO pass on to next lower priority
        return relativePath || this.uriLabelProvider.getLongName(uri);
    }
}
