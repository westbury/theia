/*
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Widget } from '@phosphor/widgets';
import { Disposable, Event } from '@theia/core';

/**
 * Terminal UI widget.
 */
export const TerminalWidget = Symbol('TerminalWidget');
export interface TerminalWidget extends Disposable, Widget {
    /**
     * Start terminal and return terminal id.
     */
    start(): Promise<number>;

    /**
     * Send text to the terminal server.
     * @param text - text content.
     */
    sendText(text: string): void;

    /**
     * Event which fires when terminal did closed. Event value contains closed terminal widget definition.
     */
    onTerminalDidClose: Event<TerminalWidget>;
}

/**
 * Terminal widget options.
 */
export const TerminalWidgetOptions = Symbol('TerminalWidgetOptions');
export interface TerminalWidgetOptions {

    /**
     * Human readable terminal representation on the UI.
     */
    readonly title?: string;

    /**
     * Path to the executable shell. For example: `/bin/bash`, `bash`, `sh`.
     */
    readonly shellPath?: string;

    /**
     * Shell arguments to executable shell, for example: [`-l`] - without login.
     */
    readonly shellArgs?: string[];

    /**
     * Current working directory.
     */
    readonly cwd?: string;

    /**
     * Environment variables for terminal.
     */
    readonly env?: { [key: string]: string | undefined };

    /**
     * In case `destroyTermOnClose` is true - terminal process will be destroyed on close terminal widget, otherwise will be kept
     * alive.
     */
    readonly destroyTermOnClose?: boolean;

    /**
     * Terminal server side can send to the client `terminal title` to display this value on the UI. If
     * overrideTitle = true, we skip this title and use our own custom title, defined by 'title' argument.
     * If overrideTitle = false, we are using terminal title from the server side.
     */
    readonly overrideTitle?: boolean;

    /**
     * Terminal id. Should be unique for all DOM.
     */
    readonly id?: string;
}
