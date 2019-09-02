/********************************************************************************
 * Copyright (C) 2019 Arm and others.
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
import { Disposable, DisposableCollection, Emitter, Event } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { FileSystem, FileShouldOverwrite, FileStat } from '../common/filesystem';
import { FileChange, DidFilesChangedParams, FileChangeType, FileSystemWatcherServer, WatchOptions } from '../common/filesystem-watcher-protocol';
import { FileSystemPreferences } from './filesystem-preferences';

export interface FileStatObservable extends Disposable {
    stat: FileStat;
}

// interface to server, plus interface to actual watcher
export interface FileSystemWatcherNew {

    getFileStat(uri: string, onDidChange: (event: DidFilesChangedParams) => void): Promise<FileStat | undefined>;

    unwatch(uri: string);
}

interface DirectoryWatcher {
    onDidChange(changes: FileChange[]);
}

@injectable()
export class FileSystemWatcherConsolidator {

    @inject(FileSystemWatcherNew)
    protected readonly underlyingWatcher: FileSystemWatcherNew;

    @inject(FileSystem)
    protected readonly filesystem: FileSystem;

    protected fileWatchers: { [uri: string]: DirectoryWatcher[]; } = {};

    /**
     * Returns the file stat for the given URI.
     *
     * If the uri points to a folder it will contain one level of unresolved children.
     *
     * `undefined` if a file for the given URI does not exist.
     */
    async getFileStat(uri: string, onDidChange: (changes: FileChange[]) => void): Promise<FileStatObservable | undefined> {

        const fileWatchers = this.fileWatchers;

        const dirWatcher = <DirectoryWatcher>{
            onDidChange
        };

        let stat: FileStat;

        const fileWatcher = this.fileWatchers[uri];
        if (fileWatcher) {
            fileWatcher.push(dirWatcher);
            stat = await this.filesystem.getFileStat(uri);
            if (!stat) {
                return undefined;
            }

        } else {
            // First watch on this directory, so notify server
            stat = await this.underlyingWatcher.getFileStat(uri, (event: DidFilesChangedParams) => { });

            const newFileWatcher = [dirWatcher];
            this.fileWatchers[uri] = newFileWatcher;
        }

        const dispose = () => {
            const index = fileWatcher.indexOf(dirWatcher, 0);
            if (index > -1) {
                fileWatcher.splice(index, 1);
            }

            if (fileWatcher.length === 0) {
                delete fileWatchers[uri];

                // Now we need to tell the server to stop monitoring this url.
                this.underlyingWatcher.unwatch(uri);
            }

        }

        return <FileStatObservable>{
            stat,
            dispose
        };
    }

    protected onDidFilesChanged(event: DidFilesChangedParams): void {

        const directoryOf = (change: FileChange) => {
            const uri = new URI(change.uri);
            const parent = uri.parent;
            return parent.toString();
        };

        const x = event.changes.reduce((rv, change) => {
            (rv[directoryOf(change)] = rv[directoryOf(change)] || []).push(change);
            return rv;
        }, <{ [uri: string]: FileChange[] }>{});

        for (const uri of Object.keys(x)) {
            const fileWatcher = this.fileWatchers[uri];
            for (const y of fileWatcher) {
                const changes = x[uri];
                y.onDidChange(changes);
            }
        }
    }

}
