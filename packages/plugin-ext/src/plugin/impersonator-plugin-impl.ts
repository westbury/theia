/********************************************************************************
 * Copyright (C) 2021 Arm and others.
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
import * as theia from '@theia/plugin';
import { ImpersonatorPluginMain } from '../common/plugin-api-rpc';

export class ImpersonatorPluginImpl implements theia.ImpersonatorPlugin {

    private disposed: boolean;

    constructor(readonly id: string, private proxy: ImpersonatorPluginMain) {
    }

    dispose(): void {
        // if (!this.disposed) {
        //     this.proxy.$dispose(this.name).then(() => {
        //         this.disposed = true;
        //     });
        // }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn(functionName: string, value: Array<any>): Promise<any> {
        this.validate();
        return this.proxy.$fn(functionName, value);
    }

    private validate(): void {
        if (this.disposed) {
            throw new Error('Channel has been closed');
        }
    }
}
