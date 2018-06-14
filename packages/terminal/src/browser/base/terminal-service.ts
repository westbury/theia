/*
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
import { TerminalWidgetOptions, TerminalWidget } from './terminal-model';

/**
 * Service manipulating terminal widgets.
 */
export const TerminalService = Symbol("TerminalService");
export interface TerminalService {
    /**
     * Create new terminal with predefined options.
     * @param options - terminal options.
     */
    newTerminal(options: TerminalWidgetOptions): Promise<TerminalWidget>;

    /**
     * Display new terminal widget on the bottom panel.
     * @param termWidget - widget to attach to the bottom panel.
     */
    activateWidget(termWidget: TerminalWidget): void;

    // /**
    //  * Hide panel where is located created terminal widget.
    //  * @param termWidget - terminal widget to hide.
    //  */
    // collapseWidget(termWidget: TerminalWidget): void;
}
