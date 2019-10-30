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

import { HgCommandServer, CommandResults } from './hg-command-server';
import { ChildProcess } from 'child_process';
import { Disposable } from '@theia/core';

export class HGRepo implements Disposable {

    protected server = new HgCommandServer();

    protected queue: Promise<void> = Promise.resolve();

    public latestCommandCounter: number = 0;

    /*
     * Create a new HGRepo with a path defined by the passed in path.
     */
    constructor(private readonly startCommandServer: (path: string) => Promise<ChildProcess>, private readonly path: string) { }

    public async start(): Promise<void> {
        await this.server.start(this.startCommandServer, this.path);
    }

    public dispose(): void {
        this.server.stop();
    }

    /*
     * Execute server command, throwing any errors
     */
    public async runCommand(args: string | string[], responseProvider?: (promptKey: string) => Promise<string>): Promise<string[]> {
        const argsArray: string[] = typeof args === 'string' ? [args] : args;
        const q: Promise<CommandResults> = this.queue.then(() => this.server.runCommand(argsArray, undefined, responseProvider));
        this.queue = q.then(() => { });
        const commandResults = await q;
        if (commandResults.resultCode !== 0) {
            throw new Error(`"hg ${argsArray.join(' ')}" failed: ${commandResults.outputChunks.join('\n')} ${commandResults.errorChunks.join()}`);
        }
        return commandResults.outputChunks;
    }

    /*
     * Execute server command, returning errors in result
     */
    public async runCommandReturningErrors(args: string | string[], responseProvider?: (promptKey: string) => Promise<string>): Promise<CommandResults> {
        const argsArray: string[] = typeof args === 'string' ? [args] : args;
        const q: Promise<CommandResults> = this.queue.then(() => this.server.runCommand(argsArray, undefined, responseProvider));
        this.queue = q.then(() => { });
        const commandResults = await q;
        return commandResults;
    }
}
